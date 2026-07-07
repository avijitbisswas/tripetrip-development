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
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '',
    booking_reference: '',
    amount: '',
    status: 'due',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    reservation_id: '',
    folio_entry_id: '',
    amount: '',
    payment_method: 'upi',
  });
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
        })),
    [records.records],
  );
  const paymentTotals = useMemo(() => {
    const pending = payments.filter((payment) => payment.status === 'pending_approval').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const recorded = payments.filter((payment) => payment.status === 'recorded').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return { pending, recorded };
  }, [payments]);

  const reservationMap = useMemo(() => new Map(reservations.map((reservation) => [reservation.id, reservation])), [reservations]);
  const folioMap = useMemo(() => new Map(folioEntries.map((folio) => [folio.id, folio])), [folioEntries]);

  const reservationBalances = useMemo(
    () =>
      reservations.map((reservation) => {
        const linkedFolios = folioEntries.filter((folio) => folio.reservation_id === reservation.id);
        const linkedPayments = payments.filter((payment) => payment.reservation_id === reservation.id && payment.status !== 'failed' && payment.status !== 'reversed');
        const folioTotal = linkedFolios.reduce((sum, folio) => {
          const quantity = Number(folio.quantity || 1);
          const amount = Number(folio.amount || 0) * quantity;
          if (folio.entry_type === 'discount' || folio.entry_type === 'payment') return sum - amount;
          return sum + amount;
        }, 0);
        const recordedPayments = linkedPayments
          .filter((payment) => payment.status === 'recorded' || payment.status === 'pending_approval')
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const billedAmount = Math.max(folioTotal, Number(reservation.total_amount || 0));
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
      })),
    [folioMap, payments, reservationMap],
  );

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
      });
      setInvoiceForm({
        invoice_number: '',
        booking_reference: '',
        amount: '',
        status: 'due',
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
              (payment.status === 'recorded' || payment.status === 'pending_approval'),
          )
          .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
        const linkedFolio = paymentForm.folio_entry_id ? folioEntries.find((folio) => folio.id === paymentForm.folio_entry_id) : null;
        const reservationBilledAmount = Math.max(
          Number(reservation?.total_amount || 0),
          linkedFolios.reduce((sum, folio) => {
            const quantity = Number(folio.quantity || 1);
            const amount = Number(folio.amount || 0) * quantity;
            if (folio.entry_type === 'discount' || folio.entry_type === 'payment') return sum - amount;
            return sum + amount;
          }, 0),
        );
        const nextRecordedTotal = existingRecordedPayments + paymentAmount;
        const nextOutstanding = Math.max(reservationBilledAmount - nextRecordedTotal, 0);

        if (linkedFolio) {
          const folioTarget = Number(linkedFolio.amount || 0) * Number(linkedFolio.quantity || 1);
          await updateVendorPmsRecord('folios', organizationId, linkedFolio.id, {
            payment_state: paymentAmount >= folioTarget ? 'settled' : 'partial',
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
        <form className="grid gap-3 md:grid-cols-[0.75fr_1fr_0.55fr_0.55fr_auto]" onSubmit={handleInvoiceSubmit}>
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
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
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
        <Metric label="Receivables" value="INR 4.2L" detail="12 invoices" />
        <Metric label="Expenses" value="INR 82K" detail="This month" />
        <Metric label="Payouts" value={formatCurrency(paymentTotals.pending)} detail="Pending approval" />
        <Metric label="Ledger Health" value="98%" detail="Reconciled" />
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
              </div>
              <div className="text-sm font-black text-slate-950">{formatCurrency(payment.amount)}</div>
              <StatePill state={titleCase(payment.status)} />
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
