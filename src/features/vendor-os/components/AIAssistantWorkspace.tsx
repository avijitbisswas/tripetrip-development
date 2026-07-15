import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listVendorAccountingRecords, listVendorPmsRecords } from '../api';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import type { VendorFolioEntryRecord, VendorPaymentRecord, VendorPmsReservationRecord, VendorRoomRecord } from '../types';

interface AIAssistantWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
}

const approvalSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Human Approval',
    detail: 'AI can draft, summarize, and recommend, but pricing, payouts, cancellations, and public listing changes require approval.',
    icon: ShieldCheck,
  },
  {
    title: 'Audit-ready prompts',
    detail: 'Every generated insight maps to module context, confidence, reviewer, and downstream action.',
    icon: ClipboardCheck,
  },
  {
    title: 'Operational memory',
    detail: 'The assistant reads CRM, inbox, PMS, tours, activities, fleet, accounting, and marketplace signals as one business context.',
    icon: Brain,
  },
];

const insightStatusOptions = ['review', 'ready', 'approved', 'dismissed'];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function StatePill({ state }: { state: string }) {
  const attention = ['Attention', 'Urgent', 'Review', 'Needs approval'].includes(state);
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

export function AIAssistantWorkspace({ organizationId, branchId }: AIAssistantWorkspaceProps) {
  const records = useVendorOSRecords('ai_assistant', organizationId);
  const marketplaceRecords = useVendorOSRecords('marketplace', organizationId);
  const mutations = useVendorOSRecordMutations('ai_assistant', organizationId, branchId);
  const [insightForm, setInsightForm] = useState({
    title: '',
    recommendation: '',
    confidence: '',
    status: 'review',
  });
  const [generating, setGenerating] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [reservations, setReservations] = useState<VendorPmsReservationRecord[]>([]);
  const [rooms, setRooms] = useState<VendorRoomRecord[]>([]);
  const [folioEntries, setFolioEntries] = useState<VendorFolioEntryRecord[]>([]);
  const [payments, setPayments] = useState<VendorPaymentRecord[]>([]);
  const [operationsError, setOperationsError] = useState<string | null>(null);
  const liveInsights = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        title: String(record.title || 'Untitled AI insight'),
        recommendation: String(record.recommendation || 'Recommendation pending review'),
        confidence:
          record.confidence === null || record.confidence === undefined
            ? 'Confidence pending'
            : `${record.confidence}% confidence`,
        state: titleCase(String(record.status || 'review')),
      })),
    [records.records],
  );

  useEffect(() => {
    let active = true;

    async function loadOperationsSignals() {
      if (!organizationId) {
        if (active) {
          setReservations([]);
          setRooms([]);
          setFolioEntries([]);
          setPayments([]);
          setOperationsError(null);
        }
        return;
      }

      setOperationsError(null);

      try {
        const [reservationRows, roomRows, folioRows, paymentRows] = await Promise.all([
          listVendorPmsRecords('reservations', organizationId),
          listVendorPmsRecords('rooms', organizationId),
          listVendorPmsRecords('folio_entries', organizationId),
          listVendorAccountingRecords('payments', organizationId),
        ]);

        if (!active) return;
        setReservations(reservationRows);
        setRooms(roomRows);
        setFolioEntries(folioRows);
        setPayments(paymentRows);
      } catch (error) {
        if (!active) return;
        setOperationsError(error instanceof Error ? error.message : 'Unable to load live AI signals');
      }
    }

    void loadOperationsSignals();

    return () => {
      active = false;
    };
  }, [organizationId]);

  const liveMarketplaceSignals = useMemo(() => {
    const syncs = marketplaceRecords.records.map((record) => {
      const metadata = (record.metadata as Record<string, unknown> | null) || {};
      return {
        title: String(metadata.listing_title || record.title || 'Marketplace listing'),
        syncStatus: String(record.sync_status || metadata.sync_status || 'pending'),
        approvalStatus: String(metadata.approval_status || 'open'),
      };
    });

    return {
      pendingApprovals: syncs.filter((record) => record.approvalStatus === 'pending').length,
      failedSyncs: syncs.filter((record) => record.syncStatus === 'failed').length,
      liveListings: syncs.filter((record) => record.syncStatus === 'synced').length,
    };
  }, [marketplaceRecords.records]);

  const operationalSignals = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    const activeStatuses = new Set(['reserved', 'confirmed', 'checked_in']);
    const openPaymentStates = new Set(['open', 'pending']);
    const reviewPaymentStatuses = new Set(['pending', 'pending_review']);
    const dirtyRooms = rooms.filter((room) => room.housekeeping_status.toLowerCase() !== 'clean');
    const activeReservations = reservations.filter((reservation) => activeStatuses.has(reservation.status));
    const arrivalsToday = activeReservations.filter((reservation) => reservation.check_in_date === todayIso);
    const checkedIn = reservations.filter((reservation) => reservation.status === 'checked_in');
    const occupiedPercent =
      rooms.length > 0 ? Math.round((checkedIn.length / rooms.length) * 100) : Math.min(activeReservations.length * 10, 100);
    const openFolios = folioEntries.filter((entry) => openPaymentStates.has(entry.payment_state.toLowerCase()));
    const openBalance = openFolios.reduce((total, entry) => total + Number(entry.amount || 0) * Number(entry.quantity || 1), 0);
    const pendingPayments = payments.filter((payment) => reviewPaymentStatuses.has(payment.status.toLowerCase()));

    return {
      arrivalsToday,
      dirtyRooms,
      activeReservations,
      occupiedPercent,
      openFolios,
      openBalance,
      pendingPayments,
    };
  }, [folioEntries, payments, reservations, rooms]);

  const liveMetricCards = useMemo(
    () => [
      ['Insights', String(liveInsights.length + 3), 'Auditable decisions'],
      ['Draft Replies', String(Math.max(operationalSignals.arrivalsToday.length, 1) + liveMarketplaceSignals.pendingApprovals), 'Ready'],
      ['Revenue Ideas', String(Math.max(liveMarketplaceSignals.liveListings, 1) + (operationalSignals.occupiedPercent >= 75 ? 1 : 0)), 'High impact'],
      [
        'Risk Alerts',
        String(
          operationalSignals.dirtyRooms.length +
            operationalSignals.pendingPayments.length +
            liveMarketplaceSignals.failedSyncs +
            (operationalSignals.openBalance > 0 ? 1 : 0),
        ),
        'Needs review',
      ],
    ],
    [liveInsights.length, liveMarketplaceSignals, operationalSignals],
  );

  const computedBriefItems = useMemo(
    () => [
      {
        title: 'Morning operations brief',
        detail: `${operationalSignals.arrivalsToday.length} arrivals, ${operationalSignals.dirtyRooms.length} dirty rooms, ${operationalSignals.pendingPayments.length} payments awaiting review, ${liveMarketplaceSignals.pendingApprovals} listings awaiting approval`,
        state:
          operationalSignals.dirtyRooms.length > 0 || operationalSignals.pendingPayments.length > 0 ? 'Review' : 'Ready',
      },
      {
        title: 'Revenue watch',
        detail: `${operationalSignals.occupiedPercent}% occupied with INR ${Math.round(operationalSignals.openBalance).toLocaleString('en-IN')} open folios still collectible`,
        state: operationalSignals.occupiedPercent >= 80 ? 'Ready' : 'Review',
      },
      {
        title: 'Distribution health',
        detail: `${liveMarketplaceSignals.liveListings} live listings, ${liveMarketplaceSignals.failedSyncs} failed syncs, ${liveMarketplaceSignals.pendingApprovals} approvals in queue`,
        state: liveMarketplaceSignals.failedSyncs > 0 ? 'Attention' : 'Ready',
      },
    ],
    [liveMarketplaceSignals, operationalSignals],
  );

  const computedRiskAlerts = useMemo(
    () => [
      {
        title: 'Housekeeping risk',
        module: 'PMS',
        detail: `${operationalSignals.dirtyRooms.length} rooms are not clean for active or incoming stays.`,
        state: operationalSignals.dirtyRooms.length > 0 ? 'Urgent' : 'Ready',
      },
      {
        title: 'Collections watch',
        module: 'Accounting',
        detail: `${operationalSignals.openFolios.length} folio entries remain open with INR ${Math.round(operationalSignals.openBalance).toLocaleString('en-IN')} outstanding.`,
        state: operationalSignals.openBalance > 0 ? 'Attention' : 'Ready',
      },
      {
        title: 'Channel sync health',
        module: 'Marketplace',
        detail: `${liveMarketplaceSignals.failedSyncs} failed syncs and ${liveMarketplaceSignals.pendingApprovals} approval-gated listing changes are waiting.`,
        state: liveMarketplaceSignals.failedSyncs > 0 ? 'Review' : 'Ready',
      },
    ],
    [liveMarketplaceSignals, operationalSignals],
  );

  const computedReplyDrafts = useMemo(
    () => [
      {
        title: 'Arrival prep reply',
        channel: 'PMS',
        detail: `${operationalSignals.arrivalsToday.length} arriving guests can receive readiness and check-in guidance today.`,
        state: operationalSignals.arrivalsToday.length > 0 ? 'Ready' : 'Drafted',
      },
      {
        title: 'Outstanding folio follow-up',
        channel: 'Accounting',
        detail: `${operationalSignals.openFolios.length} open folios can trigger payment reminders before checkout.`,
        state: operationalSignals.openFolios.length > 0 ? 'Review' : 'Drafted',
      },
      {
        title: 'Listing approval follow-up',
        channel: 'Marketplace',
        detail: `${liveMarketplaceSignals.pendingApprovals} listing changes are ready for ops-to-admin escalation.`,
        state: liveMarketplaceSignals.pendingApprovals > 0 ? 'Ready' : 'Drafted',
      },
    ],
    [liveMarketplaceSignals.pendingApprovals, operationalSignals],
  );

  const computedPricingSuggestions = useMemo(
    () => [
      {
        title: operationalSignals.occupiedPercent >= 75 ? 'Hold or raise premium inventory' : 'Stimulate direct demand',
        detail:
          operationalSignals.occupiedPercent >= 75
            ? `Occupancy is ${operationalSignals.occupiedPercent}% with limited clean inventory left.`
            : `Occupancy is ${operationalSignals.occupiedPercent}% so packages and direct deals can lift conversion.`,
        value: operationalSignals.occupiedPercent >= 75 ? '+8%' : 'Flash sale',
        state: operationalSignals.occupiedPercent >= 75 ? 'Review' : 'Ready',
      },
      {
        title: 'Protect cash collection',
        detail: `${operationalSignals.pendingPayments.length} payments still need review before more manual credit extensions.`,
        value: `INR ${Math.round(operationalSignals.openBalance).toLocaleString('en-IN')}`,
        state: operationalSignals.pendingPayments.length > 0 ? 'Attention' : 'Ready',
      },
      {
        title: 'Recover stalled listings',
        detail: `${liveMarketplaceSignals.failedSyncs} failed syncs are suppressing sellable inventory on external channels.`,
        value: `${liveMarketplaceSignals.failedSyncs} blocked`,
        state: liveMarketplaceSignals.failedSyncs > 0 ? 'Review' : 'Ready',
      },
    ],
    [liveMarketplaceSignals.failedSyncs, operationalSignals],
  );

  const computedAutomations = useMemo(
    () => [
      {
        title: 'Create housekeeping rescue list',
        detail: `${operationalSignals.dirtyRooms.length} dirty rooms can be routed to supervisors before arrival windows.`,
        state: operationalSignals.dirtyRooms.length > 0 ? 'Queued' : 'Drafted',
      },
      {
        title: 'Escalate payment review',
        detail: `${operationalSignals.pendingPayments.length} pending payments can be grouped into one finance approval pass.`,
        state: operationalSignals.pendingPayments.length > 0 ? 'Needs approval' : 'Drafted',
      },
      {
        title: 'Push channel recovery checklist',
        detail: `${liveMarketplaceSignals.failedSyncs + liveMarketplaceSignals.pendingApprovals} marketplace issues can be dispatched to distribution ops.`,
        state:
          liveMarketplaceSignals.failedSyncs > 0 || liveMarketplaceSignals.pendingApprovals > 0 ? 'Queued' : 'Drafted',
      },
    ],
    [liveMarketplaceSignals, operationalSignals],
  );

  async function handleInsightSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        title: insightForm.title,
        recommendation: insightForm.recommendation,
        confidence: insightForm.confidence ? Number(insightForm.confidence) : null,
        status: insightForm.status,
      });
      setInsightForm({
        title: '',
        recommendation: '',
        confidence: '',
        status: 'review',
      });
      await records.refresh();
      setFormMessage('AI insight created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create AI insight');
    }
  }

  async function handleGenerateBrief() {
    if (!organizationId) {
      setFormMessage('Select an organization before generating an AI brief');
      return;
    }

    setGenerating(true);
    setFormMessage(null);

    try {
      const response = await fetch('/api/vendor-os/ai/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          branchId: branchId || null,
          organizationName: 'Tripetrip Vendor OS',
          branchName: branchId ? 'Selected branch' : 'All branches',
          signals: [
            `${operationalSignals.arrivalsToday.length} arrivals today`,
            `${operationalSignals.dirtyRooms.length} dirty rooms awaiting dispatch`,
            `${operationalSignals.pendingPayments.length} payments pending review`,
            `${liveMarketplaceSignals.failedSyncs} marketplace sync failures`,
          ],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Unable to generate AI brief');
      }

      const insight = (await response.json()) as {
        title: string;
        recommendation: string;
        confidence: number;
        status: string;
      };

      await mutations.createRecord({
        title: insight.title,
        recommendation: insight.recommendation,
        confidence: insight.confidence,
        status: insight.status,
      });
      await records.refresh();
      setFormMessage('AI brief generated');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to generate AI brief');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Briefs, drafts, pricing, risk
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">AI Operations Assistant</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Convert live Vendor OS signals into daily briefs, reply drafts, pricing recommendations, risk alerts, and approval-ready automations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
              disabled={generating || mutations.submitting || !organizationId}
              type="button"
              onClick={handleGenerateBrief}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Brief
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <MessageSquareText className="mr-2 h-4 w-4" />
              Draft Reply
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">AI Insight Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_ai_insights</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Auditable AI Record
          </span>
        </div>
        <form className="grid gap-3 xl:grid-cols-[0.85fr_1.35fr_0.45fr_0.55fr_auto]" onSubmit={handleInsightSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Insight title *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="AI insight"
              required
              value={insightForm.title}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, title: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Recommendation *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Recommended action"
              required
              value={insightForm.recommendation}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, recommendation: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Confidence</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              max="100"
              min="0"
              type="number"
              value={insightForm.confidence}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, confidence: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={insightForm.status}
              onChange={(inputEvent) => setInsightForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              {insightStatusOptions.map((status) => (
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
            Create AI Insight
          </Button>
        </form>
        {(formMessage || mutations.error || records.error || marketplaceRecords.error || operationsError) && (
          <p className="mt-3 text-xs font-bold text-slate-500">
            {formMessage || mutations.error || records.error || marketplaceRecords.error || operationsError}
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {liveMetricCards.map(([label, value, detail]) => (
          <Metric key={label} label={label} value={value} detail={detail} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Daily Brief</h3>
          </div>
          <div className="space-y-3">
            {liveInsights.map((insight) => (
              <div key={insight.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{insight.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">{insight.recommendation}</div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-700">{insight.confidence}</div>
                  </div>
                  <StatePill state={insight.state} />
                </div>
              </div>
            ))}
            {computedBriefItems.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Risk Alerts</h3>
          </div>
          <div className="space-y-3">
            {computedRiskAlerts.map((alert) => (
              <div key={alert.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{alert.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{alert.module}</div>
                  </div>
                  <StatePill state={alert.state} />
                </div>
                <div className="mt-3 text-sm text-slate-600">{alert.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Reply Drafts</h3>
          </div>
          <div className="space-y-3">
            {computedReplyDrafts.map((draft) => (
              <div key={draft.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{draft.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{draft.channel}</div>
                  </div>
                  <StatePill state={draft.state} />
                </div>
                <div className="mt-3 text-sm text-slate-600">{draft.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Pricing Suggestions</h3>
          </div>
          <div className="space-y-3">
            {computedPricingSuggestions.map((price) => (
              <div key={price.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{price.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{price.detail}</div>
                  </div>
                  <StatePill state={price.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{price.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Automation Queue</h3>
          </div>
          <div className="space-y-3">
            {computedAutomations.map((automation) => (
              <div key={automation.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{automation.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{automation.detail}</div>
                  </div>
                  <StatePill state={automation.state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {approvalSignals.map(({ title, detail, icon: Icon }) => (
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Bot className="h-5 w-5 text-emerald-600" />
          <div>
            <div className="text-sm font-black text-slate-950">AI provider integration ready</div>
            <div className="mt-1 text-sm text-slate-600">
              The workspace is structured for future model calls while keeping current recommendations deterministic and auditable.
            </div>
          </div>
          <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" />
        </div>
      </section>
    </div>
  );
}
