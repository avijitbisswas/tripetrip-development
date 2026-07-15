import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDownUp,
  Banknote,
  Calculator,
  ClipboardList,
  FileText,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createVendorAccountingRecord, listVendorAccountingRecords, listVendorPmsRecords, updateVendorPmsRecord } from '../api';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import type { VendorFolioEntryRecord, VendorPaymentRecord, VendorPmsReservationRecord } from '../types';
import { getAccommodationModuleInsights } from '../accommodationModuleInsights';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import { AccommodationInsightPanel } from './AccommodationInsightPanel';

interface AccountingWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
  accommodationAccess?: ResolvedVendorAccommodationAccess | null;
}

const invoices = [
  { number: 'INV-2048', booking: 'Goa Beach Escape', amount: 'INR 29,999', state: 'Due' },
  { number: 'INV-2051', booking: 'Kerala Houseboat', amount: 'INR 18,400', state: 'Sent' },
  { number: 'INV-2057', booking: 'Luxury SUV Rental', amount: 'INR 7,299', state: 'Paid' },
];

const expenses = [
  { title: 'Fuel Expense', branch: 'Fleet depot', amount: 'INR 12,400', state: 'Approved' },
  { title: 'Guide payout advance', branch: 'Tours', amount: 'INR 8,000', state: 'Review' },
  { title: 'Room linen purchase', branch: 'PMS', amount: 'INR 21,600', state: 'Booked' },
];

const payouts = [
  { title: 'Tripetrip Payout', detail: 'Marketplace settlement batch', value: 'INR 1.2L', state: 'Processing' },
  { title: 'Supplier Commission', detail: 'Dubai Weekend package', value: '12%', state: 'Reconcile' },
  { title: 'Direct Booking Margin', detail: 'Goa flash deal savings', value: 'INR 18,900', state: 'Ready' },
];

const ledgerItems = [
  { title: 'GST Output', detail: 'June collection estimate', value: 'INR 42,300', state: 'Accrued' },
  { title: 'Branch Ledger', detail: 'Goa Villa Desk', value: 'Balanced', state: 'Clean' },
  { title: 'Commission Mapping', detail: 'Marketplace + supplier splits', value: '3 rules', state: 'Active' },
];

const financeSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Booking-linked ledger',
    detail: 'Every invoice, payout, commission, and tax event maps back to Tripetrip booking records.',
    icon: ArrowDownUp,
  },
  {
    title: 'Finance controls',
    detail: 'Role-based approval protects expenses, refunds, payouts, and ledger exports.',
    icon: ShieldCheck,
  },
  {
    title: 'Revenue signals',
    detail: 'Branch margin, direct-booking savings, and marketplace commission impact stay visible.',
    icon: TrendingUp,
  },
];

const invoiceStatusOptions = ['due', 'sent', 'paid', 'overdue'];
const invoiceKindOptions = ['gst', 'proforma', 'credit_note'];

function formatCurrency(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'INR',
  })
    .format(Number.isFinite(amount) ? amount : 0)
    .replace('₹', 'INR ');
}

function titleCase(value?: string | null) {
  if (!value) return 'Unknown';
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function deriveReservationPaymentStatus(outstanding: number, billedAmount: number) {
  if (billedAmount <= 0) return 'paid';
  if (outstanding <= 0) return 'paid';
  if (outstanding < billedAmount) return 'partial';
  return 'pending';
}

function getRefundAmount(payment: VendorPaymentRecord) {
  return Math.max(Number((payment as VendorPaymentRecord & { refund_amount?: unknown }).refund_amount || 0), 0);
}

function getNetCapturedAmount(payment: VendorPaymentRecord) {
  const gross = Number(payment.amount || 0);
  if (payment.status === 'failed' || payment.status === 'reversed') return 0;
  return Math.max(gross - getRefundAmount(payment), 0);
}

function deriveFolioPaymentState(netCapturedAmount: number, targetAmount: number) {
  if (netCapturedAmount <= 0) return 'open';
  if (netCapturedAmount >= targetAmount) return 'settled';
  return 'partial';
}

function calculateBilledAmount(reservation: VendorPmsReservationRecord | undefined, linkedFolios: VendorFolioEntryRecord[]) {
  const folioTotal = linkedFolios.reduce((sum, folio) => {
    const quantity = Number(folio.quantity || 1);
    const amount = Number(folio.amount || 0) * quantity;
    if (folio.entry_type === 'discount' || folio.entry_type === 'payment') return sum - amount;
    return sum + amount;
  }, 0);

  return Math.max(folioTotal, Number(reservation?.total_amount || 0));
}

function StatePill({ state }: { state: string }) {
  const attention = ['Due', 'Review', 'Reconcile', 'Processing'].includes(state);
  return (
    <span
      className={
        attention
          ? 'w-fit rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-100'
          : 'w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100'
      }
    >
      {state}
    </span>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{detail}</div>
    </div>
  );
}

export function AccountingWorkspace({ organizationId, branchId, accommodationAccess }: AccountingWorkspaceProps) {
  const records = useVendorOSRecords('accounting', organizationId);
  const mutations = useVendorOSRecordMutations('accounting', organizationId, branchId);
  const accommodationInsight = getAccommodationModuleInsights('accounting', accommodationAccess);
  const canRefundControls =
    !accommodationAccess?.isAccommodationProvider ||
    accommodationAccess.enforcementMode === 'open' ||
    accommodationAccess.resolvedCapabilities['billing.refund_controls'];
  const canNightAudit =
    !accommodationAccess?.isAccommodationProvider ||
    accommodationAccess.enforcementMode === 'open' ||
    accommodationAccess.resolvedCapabilities['billing.night_audit'];
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    booking_reference: '',
    amount: '',
    status: 'due',
    invoice_kind: 'gst',
    customer_gstin: '',
    supply_state: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    reservation_id: '',
    folio_entry_id: '',
    amount: '',
    payment_method: 'upi',
  });
  const [refundDrafts, setRefundDrafts] = useState<Record<string, { amount: string; reason: string; open: boolean }>>({});
  const [payments, setPayments] = useState<VendorPaymentRecord[]>([]);
  const [reservations, setReservations] = useState<VendorPmsReservationRecord[]>([]);
  const [folioEntries, setFolioEntries] = useState<VendorFolioEntryRecord[]>([]);
  const liveInvoices = useMemo(
    () =>
      records.records
        .filter((record) => String(record.record_type || 'invoice') === 'invoice')
        .map((record) => ({
          id: String(record.id),
          number: String(record.invoice_number || record.number || 'Draft invoice'),
          booking: String(record.booking_reference || record.booking || record.customer_name || 'Unlinked booking'),
          amount: formatCurrency(record.amount),
          state: titleCase(String(record.status || 'due')),
          invoiceKind: titleCase(String(record.invoice_kind || 'invoice')),
          gstin: String(record.customer_gstin || ''),
          supplyState: String(record.supply_state || ''),
        })),
    [records.records],
  );
  const paymentTotals = useMemo(() => {
    const pending = payments.filter((payment) => payment.status === 'pending_approval').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const recorded = payments.reduce((sum, payment) => sum + getNetCapturedAmount(payment), 0);
    const refunds = payments.reduce((sum, payment) => sum + getRefundAmount(payment), 0);
    return { pending, recorded, refunds };
  }, [payments]);

  const reservationMap = useMemo(() => new Map(reservations.map((reservation) => [reservation.id, reservation])), [reservations]);
  const folioMap = useMemo(() => new Map(folioEntries.map((folio) => [folio.id, folio])), [folioEntries]);

  const reservationBalances = useMemo(
    () =>
      reservations.map((reservation) => {
        const linkedFolios = folioEntries.filter((folio) => folio.reservation_id === reservation.id);
        const linkedPayments = payments.filter((payment) => payment.reservation_id === reservation.id && payment.status !== 'failed' && payment.status !== 'reversed');
        const recordedPayments = linkedPayments
          .filter((payment) => payment.status === 'recorded' || payment.status === 'pending_approval' || payment.status === 'partially_refunded' || payment.status === 'refunded')
          .reduce((sum, payment) => sum + getNetCapturedAmount(payment), 0);
        const billedAmount = calculateBilledAmount(reservation, linkedFolios);
        const outstanding = Math.max(billedAmount - recordedPayments, 0);

        return {
          id: reservation.id,
          guestName: reservation.guest_name,
          stay: `${reservation.check_in_date} -> ${reservation.check_out_date}`,
          billedAmount,
          recordedPayments,
          outstanding,
          paymentStatus: reservation.payment_status,
          folioCount: linkedFolios.length,
        };
      }),
    [folioEntries, payments, reservations],
  );

  const paymentRows = useMemo(
    () =>
      payments.map((payment) => ({
        ...payment,
        reservationLabel: reservationMap.get(payment.reservation_id || '')?.guest_name || payment.reservation_id || 'Unlinked reservation',
        folioLabel: payment.folio_entry_id ? folioMap.get(payment.folio_entry_id)?.title || payment.folio_entry_id : null,
        refundAmount: getRefundAmount(payment),
        netAmount: getNetCapturedAmount(payment),
      })),
    [folioMap, payments, reservationMap],
  );

  const nightAuditSummary = useMemo(() => {
    const checkedOutPending = reservations.filter(
      (reservation) => reservation.status === 'checked_out' && reservation.payment_status !== 'paid',
    ).length;
    const openFolios = folioEntries.filter((folio) => folio.payment_state !== 'settled' && folio.payment_state !== 'void').length;
    const pendingApprovals = payments.filter((payment) => payment.status === 'pending_approval').length;
    const refundValue = payments.reduce((sum, payment) => sum + getRefundAmount(payment), 0);
    const outstanding = reservationBalances.reduce((sum, reservation) => sum + reservation.outstanding, 0);

    return {
      checkedOutPending,
      openFolios,
      pendingApprovals,
      refundValue,
      outstanding,
      closeable: checkedOutPending === 0 && openFolios === 0 && pendingApprovals === 0,
    };
  }, [folioEntries, payments, reservationBalances, reservations]);

  useEffect(() => {
    if (organizationId) {
      void refreshLinkedRecords().catch(() => undefined);
    }
  }, [organizationId]);

  async function refreshLinkedRecords() {
    if (!organizationId) return;

    const [paymentRows, reservationRows, folioRows] = await Promise.all([
      listVendorAccountingRecords('payments', organizationId),
      listVendorPmsRecords('reservations', organizationId),
      listVendorPmsRecords('folios', organizationId),
    ]);

    setPayments(paymentRows);
    setReservations(reservationRows);
    setFolioEntries(folioRows);
  }

  async function handleInvoiceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        record_type: 'invoice',
        invoice_number: invoiceForm.invoice_number,
        booking_reference: invoiceForm.booking_reference,
        amount: Number(invoiceForm.amount),
        status: invoiceForm.status,
        invoice_kind: invoiceForm.invoice_kind,
        customer_gstin: invoiceForm.customer_gstin || null,
        supply_state: invoiceForm.supply_state || null,
      });
      setInvoiceForm({
        invoice_number: '',
        booking_reference: '',
        amount: '',
        status: 'due',
        invoice_kind: 'gst',
        customer_gstin: '',
        supply_state: '',
      });
      await records.refresh();
      setFormMessage('Invoice created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create invoice');
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    if (!organizationId) return;

    try {
      const paymentAmount = Number(paymentForm.amount);
      const paymentStatus = paymentForm.payment_method === 'upi' ? 'pending_approval' : 'recorded';

      await createVendorAccountingRecord('payments', organizationId, branchId || null, {
        reservation_id: paymentForm.reservation_id,
        folio_entry_id: paymentForm.folio_entry_id || null,
        amount: paymentAmount,
        payment_method: paymentForm.payment_method,
        status: paymentStatus,
      });

      if (paymentStatus === 'recorded') {
        const reservation = reservations.find((entry) => entry.id === paymentForm.reservation_id);
        const linkedFolios = folioEntries.filter((folio) => folio.reservation_id === paymentForm.reservation_id);
        const existingRecordedPayments = payments
          .filter(
            (payment) =>
              payment.reservation_id === paymentForm.reservation_id &&
              (payment.status === 'recorded' || payment.status === 'pending_approval' || payment.status === 'partially_refunded' || payment.status === 'refunded'),
          )
          .reduce((sum, payment) => sum + getNetCapturedAmount(payment), 0);
        const linkedFolio = paymentForm.folio_entry_id ? folioEntries.find((folio) => folio.id === paymentForm.folio_entry_id) : null;
        const reservationBilledAmount = calculateBilledAmount(reservation, linkedFolios);
        const nextRecordedTotal = existingRecordedPayments + paymentAmount;
        const nextOutstanding = Math.max(reservationBilledAmount - nextRecordedTotal, 0);

        if (linkedFolio) {
          const folioTarget = Number(linkedFolio.amount || 0) * Number(linkedFolio.quantity || 1);
          await updateVendorPmsRecord('folios', organizationId, linkedFolio.id, {
            payment_state: deriveFolioPaymentState(paymentAmount, folioTarget),
          });
        }

        if (reservation) {
          await updateVendorPmsRecord('reservations', organizationId, reservation.id, {
            payment_status: deriveReservationPaymentStatus(nextOutstanding, reservationBilledAmount),
          });
        }
      }

      setPaymentForm({ reservation_id: '', folio_entry_id: '', amount: '', payment_method: 'upi' });
      await refreshLinkedRecords();
      setFormMessage('Payment recorded');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to record payment');
    }
  }

  async function handlePaymentReview(payment: VendorPaymentRecord, decision: 'approve' | 'reject') {
    if (!organizationId) return;

    setFormMessage(null);

    try {
      const nextStatus = decision === 'approve' ? 'recorded' : 'reversed';
      const approvedAt = decision === 'approve' ? new Date().toISOString() : null;

      await mutations.updateRecord(payment.id, {
        status: nextStatus,
        approved_at: approvedAt,
        approved_by: 'Finance desk',
      });

      const reservation = reservations.find((entry) => entry.id === payment.reservation_id);
      const linkedFolios = folioEntries.filter((folio) => folio.reservation_id === payment.reservation_id);
      const linkedFolio = payment.folio_entry_id ? folioEntries.find((folio) => folio.id === payment.folio_entry_id) : null;
      const approvedTotal = payments
        .filter(
          (entry) =>
            entry.id !== payment.id &&
            entry.reservation_id === payment.reservation_id &&
            ['recorded', 'partially_refunded', 'refunded'].includes(entry.status),
        )
        .reduce((sum, entry) => sum + getNetCapturedAmount(entry), 0);
      const nextRecordedTotal = decision === 'approve' ? approvedTotal + getNetCapturedAmount(payment) : approvedTotal;
      const reservationBilledAmount = calculateBilledAmount(reservation, linkedFolios);
      const nextOutstanding = Math.max(reservationBilledAmount - nextRecordedTotal, 0);

      if (linkedFolio) {
        const folioTarget = Number(linkedFolio.amount || 0) * Number(linkedFolio.quantity || 1);
        await updateVendorPmsRecord('folios', organizationId, linkedFolio.id, {
          payment_state: decision === 'approve' ? deriveFolioPaymentState(nextRecordedTotal, folioTarget) : 'open',
        });
      }

      if (reservation) {
        await updateVendorPmsRecord('reservations', organizationId, reservation.id, {
          payment_status: deriveReservationPaymentStatus(nextOutstanding, reservationBilledAmount),
        });
      }

      setPayments((current) =>
        current.map((entry) =>
          entry.id === payment.id
            ? {
                ...entry,
                status: nextStatus,
                approved_at: approvedAt,
                approved_by: 'Finance desk',
              }
            : entry,
        ),
      );
      setReservations((current) =>
        current.map((entry) =>
          entry.id === payment.reservation_id
            ? {
                ...entry,
                payment_status: deriveReservationPaymentStatus(nextOutstanding, reservationBilledAmount),
              }
            : entry,
        ),
      );
      if (linkedFolio) {
        setFolioEntries((current) =>
          current.map((entry) =>
            entry.id === linkedFolio.id
              ? {
                  ...entry,
                  payment_state:
                    decision === 'approve'
                      ? deriveFolioPaymentState(nextRecordedTotal, Number(linkedFolio.amount || 0) * Number(linkedFolio.quantity || 1))
                      : 'open',
                }
              : entry,
          ),
        );
      }

      setFormMessage(`${decision === 'approve' ? 'Payment approved' : 'Payment rejected'} for ${reservation?.guest_name || 'reservation'}`);
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to review payment');
    }
  }

  async function handleRefund(payment: VendorPaymentRecord) {
    if (!organizationId) return;

    const draft = refundDrafts[payment.id];
    const refundAmount = Math.max(Number(draft?.amount || 0), 0);
    if (!refundAmount) {
      setFormMessage('Enter a refund amount before processing a refund.');
      return;
    }

    const currentRefundedAmount = getRefundAmount(payment);
    const netCapturedAmount = getNetCapturedAmount(payment);
    if (refundAmount > netCapturedAmount) {
      setFormMessage('Refund amount cannot exceed the remaining captured amount.');
      return;
    }

    setFormMessage(null);

    try {
      const nextRefundAmount = currentRefundedAmount + refundAmount;
      const nextStatus = nextRefundAmount >= Number(payment.amount || 0) ? 'refunded' : 'partially_refunded';

      await mutations.updateRecord(payment.id, {
        status: nextStatus,
        refund_amount: nextRefundAmount,
        refund_reason: draft?.reason || null,
        refunded_at: new Date().toISOString(),
      });

      const reservation = reservations.find((entry) => entry.id === payment.reservation_id);
      const linkedFolios = folioEntries.filter((folio) => folio.reservation_id === payment.reservation_id);
      const linkedFolio = payment.folio_entry_id ? folioEntries.find((folio) => folio.id === payment.folio_entry_id) : null;
      const recordedTotal = payments
        .filter(
          (entry) =>
            entry.id !== payment.id &&
            entry.reservation_id === payment.reservation_id &&
            ['recorded', 'pending_approval', 'partially_refunded', 'refunded'].includes(entry.status),
        )
        .reduce((sum, entry) => sum + getNetCapturedAmount(entry), 0);
      const nextCapturedTotal = recordedTotal + Math.max(Number(payment.amount || 0) - nextRefundAmount, 0);
      const reservationBilledAmount = calculateBilledAmount(reservation, linkedFolios);
      const nextOutstanding = Math.max(reservationBilledAmount - nextCapturedTotal, 0);

      if (linkedFolio) {
        const folioTarget = Number(linkedFolio.amount || 0) * Number(linkedFolio.quantity || 1);
        await updateVendorPmsRecord('folios', organizationId, linkedFolio.id, {
          payment_state: deriveFolioPaymentState(nextCapturedTotal, folioTarget),
        });
      }

      if (reservation) {
        await updateVendorPmsRecord('reservations', organizationId, reservation.id, {
          payment_status: nextCapturedTotal <= 0 ? 'refunded' : deriveReservationPaymentStatus(nextOutstanding, reservationBilledAmount),
        });
      }

      setPayments((current) =>
        current.map((entry) =>
          entry.id === payment.id
            ? ({
                ...entry,
                status: nextStatus,
                refund_amount: nextRefundAmount,
                refund_reason: draft?.reason || null,
              } as VendorPaymentRecord)
            : entry,
        ),
      );
      setReservations((current) =>
        current.map((entry) =>
          entry.id === payment.reservation_id
            ? {
                ...entry,
                payment_status: nextCapturedTotal <= 0 ? 'refunded' : deriveReservationPaymentStatus(nextOutstanding, reservationBilledAmount),
              }
            : entry,
        ),
      );
      if (linkedFolio) {
        setFolioEntries((current) =>
          current.map((entry) =>
            entry.id === linkedFolio.id
              ? {
                  ...entry,
                  payment_state: deriveFolioPaymentState(nextCapturedTotal, Number(linkedFolio.amount || 0) * Number(linkedFolio.quantity || 1)),
                }
              : entry,
          ),
        );
      }
      setRefundDrafts((current) => ({ ...current, [payment.id]: { amount: '', reason: '', open: false } }));
      setFormMessage(`Refund processed for ${reservation?.guest_name || 'reservation'}`);
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to process refund');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Invoices, payouts, taxes, ledger
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Accounting</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Control receivables, branch expenses, supplier payouts, commissions, taxes, ledger reconciliation, and financial exports.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <FileText className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <ClipboardList className="mr-2 h-4 w-4" />
              Export Ledger
            </Button>
          </div>
        </div>
      </section>

      <AccommodationInsightPanel insight={accommodationInsight} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Invoice Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_accounting_records</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live Finance API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={handleInvoiceSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Invoice number *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="INV-3001"
              required
              value={invoiceForm.invoice_number}
              onChange={(inputEvent) => setInvoiceForm((current) => ({ ...current, invoice_number: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Booking or customer *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Booking or customer"
              required
              value={invoiceForm.booking_reference}
              onChange={(inputEvent) => setInvoiceForm((current) => ({ ...current, booking_reference: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Amount *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              min="1"
              required
              type="number"
              value={invoiceForm.amount}
              onChange={(inputEvent) => setInvoiceForm((current) => ({ ...current, amount: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={invoiceForm.status}
              onChange={(inputEvent) => setInvoiceForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              {invoiceStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Invoice type *</span>
            <select
              aria-label="Invoice type *"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={invoiceForm.invoice_kind}
              onChange={(inputEvent) => setInvoiceForm((current) => ({ ...current, invoice_kind: inputEvent.target.value }))}
            >
              {invoiceKindOptions.map((invoiceKind) => (
                <option key={invoiceKind} value={invoiceKind}>
                  {titleCase(invoiceKind)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Customer GSTIN</span>
            <input
              aria-label="Customer GSTIN"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="27ABCDE1234F1Z5"
              value={invoiceForm.customer_gstin}
              onChange={(inputEvent) => setInvoiceForm((current) => ({ ...current, customer_gstin: inputEvent.target.value.toUpperCase() }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Supply state</span>
            <input
              aria-label="Supply state"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Goa"
              value={invoiceForm.supply_state}
              onChange={(inputEvent) => setInvoiceForm((current) => ({ ...current, supply_state: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60 md:col-span-3 md:justify-self-end"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Invoice
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Receivables"
          value={formatCurrency(reservationBalances.reduce((sum, reservation) => sum + reservation.outstanding, 0))}
          detail={`${reservationBalances.length} live balances`}
        />
        <Metric label="Expenses" value="INR 82K" detail="This month" />
        <Metric label="Payouts" value={formatCurrency(paymentTotals.pending)} detail="Pending approval" />
        <Metric label="Ledger Health" value={nightAuditSummary.closeable ? 'Ready' : 'Action'} detail="Night audit" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Night Audit Desk</h3>
          </div>
          {canNightAudit ? (
            <>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Outstanding</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(nightAuditSummary.outstanding)}</div>
                  <div className="mt-1 text-xs text-slate-500">Open guest balances</div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Checked-out pending</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{nightAuditSummary.checkedOutPending}</div>
                  <div className="mt-1 text-xs text-slate-500">Departed stays still open</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Open folios</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{nightAuditSummary.openFolios}</div>
                  <div className="mt-1 text-xs text-slate-500">Need settlement follow-up</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Refunds today</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(paymentTotals.refunds)}</div>
                  <div className="mt-1 text-xs text-slate-500">{nightAuditSummary.pendingApprovals} approvals pending</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Night audit state</div>
                <div className="mt-2 text-sm font-black text-slate-950">
                  {nightAuditSummary.closeable ? 'Ready to close day' : 'Night audit requires review'}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Close only after balances, folios, approvals, and refunds are reconciled.
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              Night audit is locked on the current accommodation plan. Core invoicing and payment capture remain available.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">GST Invoice Queue</h3>
          </div>
          <div className="space-y-3">
            {liveInvoices.map((invoice) => (
              <div key={`${invoice.id}-gst`} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{invoice.number}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{invoice.invoiceKind}</div>
                  </div>
                  <StatePill state={invoice.state} />
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-700">{invoice.booking}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {invoice.gstin ? `GSTIN ${invoice.gstin}` : 'GSTIN pending'}{invoice.supplyState ? ` / ${invoice.supplyState}` : ''}
                </div>
              </div>
            ))}
            {liveInvoices.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                GST-ready invoices will populate here after finance entries are created.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Outstanding Balances</h3>
          </div>
          <div className="space-y-3">
            {reservationBalances.map((reservation) => (
              <div key={reservation.id} className="grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <div className="text-sm font-black text-slate-950">{reservation.guestName}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{reservation.stay}</div>
                  <div className="mt-1 text-xs text-slate-500">{reservation.folioCount} folio entries</div>
                </div>
                <div className="text-right text-sm font-bold text-slate-700">
                  <div>{formatCurrency(reservation.outstanding)}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">Outstanding</div>
                </div>
                <StatePill state={titleCase(reservation.paymentStatus)} />
              </div>
            ))}
            {reservationBalances.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                Reservation-linked balances will appear here after PMS bookings and folios are created.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Settlement Desk</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Payment records tied to reservations and folio settlement</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live Payment API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_0.6fr_0.6fr_auto]" onSubmit={handlePaymentSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Reservation reference *</span>
            <select
              aria-label="Reservation reference *"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={paymentForm.reservation_id}
              onChange={(inputEvent) => setPaymentForm((current) => ({ ...current, reservation_id: inputEvent.target.value, folio_entry_id: '' }))}
            >
              <option value="">Select reservation</option>
              {reservations.map((reservation) => (
                <option key={reservation.id} value={reservation.id}>
                  {reservation.guest_name} ({reservation.check_in_date})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Folio entry</span>
            <select
              aria-label="Folio entry"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={paymentForm.folio_entry_id}
              onChange={(inputEvent) => setPaymentForm((current) => ({ ...current, folio_entry_id: inputEvent.target.value }))}
            >
              <option value="">Link later</option>
              {folioEntries
                .filter((folio) => !paymentForm.reservation_id || folio.reservation_id === paymentForm.reservation_id)
                .map((folio) => (
                  <option key={folio.id} value={folio.id}>
                    {folio.title}
                  </option>
                ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Payment amount *</span>
            <input
              aria-label="Payment amount *"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              type="number"
              min="1"
              value={paymentForm.amount}
              onChange={(inputEvent) => setPaymentForm((current) => ({ ...current, amount: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Payment method *</span>
            <select
              aria-label="Payment method *"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={paymentForm.payment_method}
              onChange={(inputEvent) => setPaymentForm((current) => ({ ...current, payment_method: inputEvent.target.value }))}
            >
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </label>
          <Button className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60" disabled={!organizationId} type="submit">
            Record Payment
          </Button>
        </form>
        <div className="mt-4 space-y-3">
          {paymentRows.map((payment) => (
            <div key={payment.id} className="grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <div className="text-sm font-black text-slate-950">{payment.reservationLabel}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{payment.payment_method}</div>
                {payment.folioLabel ? <div className="mt-1 text-xs text-slate-500">{payment.folioLabel}</div> : null}
                {payment.refundAmount > 0 ? (
                  <div className="mt-1 text-xs text-rose-600">
                    Refunded {formatCurrency(payment.refundAmount)} / Net {formatCurrency(payment.netAmount)}
                  </div>
                ) : null}
              </div>
              <div className="text-sm font-black text-slate-950">{formatCurrency(payment.amount)}</div>
              <div className="flex items-center justify-end gap-2">
                <StatePill state={titleCase(payment.status)} />
                {payment.status === 'pending_approval' ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                      onClick={() => handlePaymentReview(payment, 'approve')}
                    >
                      Approve Payment
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                      onClick={() => handlePaymentReview(payment, 'reject')}
                    >
                      Reject Payment
                    </Button>
                  </>
                ) : null}
                {canRefundControls && (payment.status === 'recorded' || payment.status === 'partially_refunded') && payment.netAmount > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    onClick={() =>
                      setRefundDrafts((current) => ({
                        ...current,
                        [payment.id]: current[payment.id]
                          ? { ...current[payment.id], open: !current[payment.id].open }
                          : { amount: String(payment.netAmount), reason: '', open: true },
                      }))
                    }
                  >
                    Refund Payment
                  </Button>
                ) : null}
              </div>
              {refundDrafts[payment.id]?.open && canRefundControls ? (
                <div className="md:col-span-3 grid gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-100 md:grid-cols-[0.6fr_1fr_auto]">
                  <input
                    aria-label={`Refund amount for ${payment.reservationLabel}`}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800"
                    min="1"
                    max={payment.netAmount}
                    type="number"
                    value={refundDrafts[payment.id]?.amount || ''}
                    onChange={(inputEvent) =>
                      setRefundDrafts((current) => ({
                        ...current,
                        [payment.id]: {
                          amount: inputEvent.target.value,
                          reason: current[payment.id]?.reason || '',
                          open: true,
                        },
                      }))
                    }
                  />
                  <input
                    aria-label={`Refund reason for ${payment.reservationLabel}`}
                    className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800"
                    placeholder="Refund reason"
                    value={refundDrafts[payment.id]?.reason || ''}
                    onChange={(inputEvent) =>
                      setRefundDrafts((current) => ({
                        ...current,
                        [payment.id]: {
                          amount: current[payment.id]?.amount || '',
                          reason: inputEvent.target.value,
                          open: true,
                        },
                      }))
                    }
                  />
                  <Button
                    type="button"
                    className="h-11 rounded-xl bg-rose-600 px-4 text-xs font-bold uppercase tracking-widest hover:bg-rose-700"
                    onClick={() => void handleRefund(payment)}
                  >
                    Process Refund
                  </Button>
                </div>
              ) : null}
              {!canRefundControls ? (
                <div className="md:col-span-3 text-xs font-semibold text-slate-500">
                  Refund controls are locked on the current accommodation plan.
                </div>
              ) : null}
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Receivables Command</h3>
          </div>
          <div className="space-y-3">
            {liveInvoices.map((invoice) => (
              <div key={invoice.id} className="grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <div className="text-sm font-black text-slate-950">{invoice.number}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{invoice.booking}</div>
                </div>
                <div className="text-lg font-black text-slate-950">{invoice.amount}</div>
                <StatePill state={invoice.state} />
              </div>
            ))}
            {invoices.map((invoice) => (
              <div key={invoice.number} className="grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div>
                  <div className="text-sm font-black text-slate-950">{invoice.number}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{invoice.booking}</div>
                </div>
                <div className="text-lg font-black text-slate-950">{invoice.amount}</div>
                <StatePill state={invoice.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Expense Desk</h3>
          </div>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{expense.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{expense.branch}</div>
                  </div>
                  <StatePill state={expense.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{expense.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Payouts & Commissions</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {payouts.map((payout) => (
              <div key={payout.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{payout.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{payout.detail}</div>
                  </div>
                  <StatePill state={payout.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{payout.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Tax & Ledger</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {ledgerItems.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {financeSignals.map(({ title, detail, icon: Icon }) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-100">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-black text-slate-950">{title}</div>
                <div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
