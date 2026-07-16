import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BarChart3,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  Download,
  Gauge,
  LineChart,
  PieChart,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listVendorAccountingRecords, listVendorPmsRecords } from '../api';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import type {
  VendorFolioEntryRecord,
  VendorHousekeepingTaskRecord,
  VendorPaymentRecord,
  VendorPmsReservationRecord,
} from '../types';
import { getAccommodationModuleInsights } from '../accommodationModuleInsights';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import { AccommodationInsightPanel } from './AccommodationInsightPanel';

interface AnalyticsWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
  accommodationAccess?: ResolvedVendorAccommodationAccess | null;
}

const executiveReports = [
  { title: 'Revenue', value: 'INR 18.4L', detail: '+18% month over month', state: 'Strong' },
  { title: 'Bookings', value: '1,204', detail: '+11% across all categories', state: 'Growing' },
  { title: 'Direct Savings', value: 'INR 3.2L', detail: 'Traveler value from direct deals', state: 'Visible' },
];

const branches = [
  { name: 'Goa Branch', revenue: 'INR 7.2L', signal: '+24%', state: 'Top branch' },
  { name: 'Manali Hotel', revenue: 'INR 4.8L', signal: '83% occupancy', state: 'Stable' },
  { name: 'Rishikesh Base', revenue: 'INR 2.1L', signal: '31 slots live', state: 'Growing' },
];

const categories = [
  { title: 'Activities', detail: 'Fastest growth segment', value: '31% conversion lift', state: 'Strong' },
  { title: 'Transport', detail: 'Fleet uptime and route fill', value: '94% uptime', state: 'Healthy' },
  { title: 'Stays', detail: 'PMS occupancy and direct deals', value: '83% occupancy', state: 'Stable' },
  { title: 'Packages', detail: 'Tour departures and DMC margin', value: '+12% margin', state: 'Review' },
];

const operationalKpis = [
  { title: 'Reply SLA', value: '8m', detail: 'Inbox average response' },
  { title: 'Guide Utilization', value: '82%', detail: 'Tours and activities' },
  { title: 'Clean Room Release', value: '91%', detail: 'PMS housekeeping' },
  { title: 'Listing Sync', value: '98%', detail: 'Marketplace protected' },
];

const exports = [
  { title: 'Executive revenue report', detail: 'Branch, category, channel, and margin summary', state: 'Ready' },
  { title: 'Marketplace conversion export', detail: 'Search, saves, direct deals, and bookings', state: 'Ready' },
  { title: 'Accounting snapshot', detail: 'Receivables, payouts, commissions, and taxes', state: 'Scheduled' },
];

const analyticsSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Cross-module reporting',
    detail: 'Reports combine CRM, PMS, tours, activities, fleet, accounting, subscriptions, and marketplace context.',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Export governance',
    detail: 'Export actions stay permission-aware and audit-friendly for owners, accountants, managers, and sales users.',
    icon: ShieldCheck,
  },
  {
    title: 'Snapshot-ready API',
    detail: 'Analytics cards align with vendor_analytics_snapshots for future scheduled reports and realtime dashboards.',
    icon: ClipboardList,
  },
];

const analyticsModuleOptions = ['crm', 'pms', 'tours', 'activities', 'fleet', 'marketplace'];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

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

function StatePill({ state }: { state: string }) {
  const attention = ['Review', 'Scheduled'].includes(state);
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

export function AnalyticsWorkspace({ organizationId, branchId, accommodationAccess }: AnalyticsWorkspaceProps) {
  const records = useVendorOSRecords('analytics', organizationId);
  const mutations = useVendorOSRecordMutations('analytics', organizationId, branchId);
  const accommodationInsight = getAccommodationModuleInsights('analytics', accommodationAccess);
  const [reservations, setReservations] = useState<VendorPmsReservationRecord[]>([]);
  const [folioEntries, setFolioEntries] = useState<VendorFolioEntryRecord[]>([]);
  const [payments, setPayments] = useState<VendorPaymentRecord[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<VendorHousekeepingTaskRecord[]>([]);
  const [selectedPropertyView, setSelectedPropertyView] = useState<'all' | string>('all');
  const [snapshotForm, setSnapshotForm] = useState({
    module: 'marketplace',
    snapshot_date: '',
    metric_label: '',
    metric_value: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveSnapshots = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        title: `${titleCase(String(record.module || 'analytics'))} Snapshot`,
        date: String(record.snapshot_date || 'Date pending'),
        label: String(record.metric_label || 'Metric'),
        value: String(record.metric_value || record.value || 'Value pending'),
      })),
    [records.records],
  );
  const branchRollups = useMemo(() => {
    const getLabel = (propertyId: string) =>
      propertyId === 'unassigned-property' ? 'Unassigned Property' : titleCase(propertyId.replace(/[-_]+/g, ' '));
    const createEmpty = (propertyId: string) => ({
      propertyId,
      name: getLabel(propertyId),
      revenue: 0,
      checkedIn: 0,
      total: 0,
      arrivals: 0,
      openFolios: 0,
      collected: 0,
    });
    const byProperty = new Map<string, ReturnType<typeof createEmpty>>();

    for (const reservation of reservations) {
      const propertyId = reservation.property_id || 'unassigned-property';
      const current = byProperty.get(propertyId) || createEmpty(propertyId);
      current.revenue += Number(reservation.total_amount || 0);
      current.total += 1;
      if (reservation.status === 'checked_in') current.checkedIn += 1;
      if (reservation.status === 'reserved') current.arrivals += 1;
      byProperty.set(propertyId, current);
    }

    for (const folio of folioEntries) {
      const propertyId = folio.property_id || 'unassigned-property';
      const current = byProperty.get(propertyId) || createEmpty(propertyId);
      if (folio.payment_state !== 'settled' && folio.payment_state !== 'void') current.openFolios += 1;
      byProperty.set(propertyId, current);
    }

    const reservationPropertyMap = new Map(
      reservations.map((reservation) => [reservation.id, reservation.property_id || 'unassigned-property']),
    );
    for (const payment of payments) {
      const propertyId = reservationPropertyMap.get(payment.reservation_id || '') || 'unassigned-property';
      const current = byProperty.get(propertyId) || createEmpty(propertyId);
      if (payment.status === 'recorded' || payment.status === 'pending_approval') {
        current.collected += Number(payment.amount || 0);
      }
      byProperty.set(propertyId, current);
    }

    return Array.from(byProperty.values()).map((branch) => ({
      ...branch,
      occupancyRate: branch.total > 0 ? Math.round((branch.checkedIn / branch.total) * 100) : 0,
    }));
  }, [folioEntries, payments, reservations]);
  const propertyViewOptions = useMemo(
    () => branchRollups.map((branch) => ({ value: branch.propertyId, label: branch.name })),
    [branchRollups],
  );
  const filteredReservations = useMemo(
    () =>
      selectedPropertyView === 'all'
        ? reservations
        : reservations.filter((reservation) => (reservation.property_id || 'unassigned-property') === selectedPropertyView),
    [reservations, selectedPropertyView],
  );
  const filteredFolios = useMemo(
    () =>
      selectedPropertyView === 'all'
        ? folioEntries
        : folioEntries.filter((folio) => (folio.property_id || 'unassigned-property') === selectedPropertyView),
    [folioEntries, selectedPropertyView],
  );
  const filteredPayments = useMemo(() => {
    if (selectedPropertyView === 'all') return payments;
    const reservationIds = new Set(filteredReservations.map((reservation) => reservation.id));
    return payments.filter((payment) => reservationIds.has(payment.reservation_id || ''));
  }, [filteredReservations, payments, selectedPropertyView]);
  const filteredHousekeepingTasks = useMemo(
    () =>
      selectedPropertyView === 'all'
        ? housekeepingTasks
        : housekeepingTasks.filter((task) => (task.property_id || 'unassigned-property') === selectedPropertyView),
    [housekeepingTasks, selectedPropertyView],
  );
  const liveOperations = useMemo(() => {
    const occupiedReservations = filteredReservations.filter((reservation) => reservation.status === 'checked_in');
    const occupancyRate =
      filteredReservations.length > 0 ? Math.round((occupiedReservations.length / filteredReservations.length) * 100) : 0;
    const upcomingArrivals = filteredReservations.filter((reservation) => reservation.status === 'reserved');
    const openFolios = filteredFolios.filter((folio) => folio.payment_state !== 'settled' && folio.payment_state !== 'void');
    const settledFolios = filteredFolios.filter((folio) => folio.payment_state === 'settled');
    const recordedPayments = filteredPayments
      .filter((payment) => payment.status === 'recorded' || payment.status === 'pending_approval')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const billedRevenue = filteredReservations.reduce((sum, reservation) => sum + Number(reservation.total_amount || 0), 0);
    const outstandingRevenue = upcomingArrivals
      .filter((reservation) => reservation.payment_status !== 'paid')
      .reduce((sum, reservation) => sum + Number(reservation.total_amount || 0), 0);

    return {
      occupancyRate,
      occupancyDetail: `${occupiedReservations.length}/${filteredReservations.length || 0} rooms occupied`,
      arrivalsCount: upcomingArrivals.length,
      nextArrival: upcomingArrivals[0] || null,
      openFoliosCount: openFolios.length,
      settledFoliosCount: settledFolios.length,
      recordedPayments,
      billedRevenue,
      outstandingRevenue,
    };
  }, [filteredFolios, filteredPayments, filteredReservations]);
  const enterpriseSummary = useMemo(
    () => ({
      propertyCount: branchRollups.length,
      readyProperties: branchRollups.filter((branch) => branch.arrivals === 0 && branch.openFolios === 0).length,
      flaggedProperties: branchRollups.filter((branch) => branch.arrivals > 0 || branch.openFolios > 0).length,
      totalCollected: branchRollups.reduce((sum, branch) => sum + branch.collected, 0),
    }),
    [branchRollups],
  );
  const branchInsights = useMemo(() => {
    if (branchRollups.length === 0) {
      return branches;
    }
    return branchRollups
      .filter((branch) => selectedPropertyView === 'all' || branch.propertyId === selectedPropertyView)
      .map((branch) => ({
        name: branch.name,
        revenue: formatCurrency(branch.revenue),
        signal: `${branch.occupancyRate}% occupancy / ${branch.openFolios} open folios`,
        state: branch.arrivals > 0 ? 'Arrivals due' : branch.openFolios > 0 ? 'Review' : 'Stable',
      }));
  }, [branchRollups, selectedPropertyView]);
  const categoryInsights = useMemo(() => {
    if (filteredReservations.length === 0 && filteredFolios.length === 0) {
      return categories;
    }

    return [
      {
        title: 'Stays',
        detail: 'PMS reservations and in-house occupancy',
        value: `${liveOperations.occupancyRate}% occupancy`,
        state: liveOperations.occupancyRate >= 70 ? 'Strong' : liveOperations.occupancyRate > 0 ? 'Stable' : 'Review',
      },
      {
        title: 'Arrivals',
        detail: 'Upcoming check-ins requiring desk readiness',
        value: `${liveOperations.arrivalsCount} arrivals`,
        state: liveOperations.arrivalsCount > 0 ? 'Stable' : 'Review',
      },
      {
        title: 'Folios',
        detail: 'Open versus settled guest billing',
        value: `${liveOperations.openFoliosCount} open / ${liveOperations.settledFoliosCount} settled`,
        state: liveOperations.openFoliosCount > 0 ? 'Review' : 'Healthy',
      },
      {
        title: 'Collections',
        detail: 'Recorded and pending payment capture',
        value: formatCurrency(liveOperations.recordedPayments),
        state: liveOperations.recordedPayments > 0 ? 'Strong' : 'Review',
      },
    ];
  }, [filteredFolios.length, filteredReservations.length, liveOperations]);
  const operationalMetrics = useMemo(() => {
    if (filteredReservations.length === 0 && filteredPayments.length === 0) {
      return operationalKpis;
    }

    return [
      { title: 'Occupancy', value: `${liveOperations.occupancyRate}%`, detail: liveOperations.occupancyDetail },
      { title: 'Arrivals Today', value: String(liveOperations.arrivalsCount), detail: liveOperations.nextArrival ? liveOperations.nextArrival.guest_name : 'No queued arrivals' },
      { title: 'Open Folios', value: String(liveOperations.openFoliosCount), detail: `${liveOperations.openFoliosCount} open folio / ${liveOperations.settledFoliosCount} settled` },
      { title: 'Collections', value: formatCurrency(liveOperations.recordedPayments), detail: `${formatCurrency(liveOperations.outstandingRevenue)} awaiting payment` },
    ];
  }, [filteredPayments.length, filteredReservations.length, liveOperations]);
  const forecastSignals = useMemo(() => {
    const openHousekeepingTasks = filteredHousekeepingTasks.filter(
      (task) => !['completed', 'done', 'cancelled'].includes(task.status.toLowerCase()),
    );
    const collectionGap = Math.max(liveOperations.billedRevenue - liveOperations.recordedPayments, 0);
    const demandPressure =
      liveOperations.occupancyRate >= 75 || liveOperations.arrivalsCount >= Math.max(2, Math.ceil(filteredReservations.length / 2));
    const revenueAtRisk = collectionGap > 0 || liveOperations.openFoliosCount > 0;
    const opsLoad = openHousekeepingTasks.length + liveOperations.arrivalsCount;

    return [
      {
        title: 'Demand forecast',
        value: demandPressure ? 'High pressure' : liveOperations.arrivalsCount > 0 ? 'Steady' : 'Light',
        detail: `${liveOperations.arrivalsCount} queued arrivals against ${liveOperations.occupancyRate}% occupancy`,
        state: demandPressure ? 'Review' : 'Ready',
      },
      {
        title: 'Revenue anomaly',
        value: formatCurrency(collectionGap),
        detail: `${liveOperations.openFoliosCount} open folios compared with ${formatCurrency(liveOperations.recordedPayments)} collected`,
        state: revenueAtRisk ? 'Review' : 'Ready',
      },
      {
        title: 'Housekeeping forecast',
        value: `${opsLoad} actions`,
        detail: `${openHousekeepingTasks.length} open tasks plus ${liveOperations.arrivalsCount} arrival checks`,
        state: opsLoad > 0 ? 'Scheduled' : 'Ready',
      },
    ];
  }, [filteredHousekeepingTasks, filteredReservations.length, liveOperations]);
  const exportRows = useMemo(() => {
    if (filteredReservations.length === 0 && filteredPayments.length === 0) {
      return exports;
    }

    const scopeLabel =
      selectedPropertyView === 'all'
        ? 'All active properties'
        : propertyViewOptions.find((option) => option.value === selectedPropertyView)?.label || selectedPropertyView;

    return [
      { title: 'Occupancy export', detail: `${scopeLabel} / ${liveOperations.occupancyDetail}`, state: 'Ready' },
      { title: 'Arrival desk report', detail: liveOperations.nextArrival ? `${liveOperations.nextArrival.guest_name} arriving ${liveOperations.nextArrival.check_in_date}` : `${scopeLabel} / No queued arrivals`, state: 'Ready' },
      { title: 'Collections summary', detail: `${scopeLabel} / ${formatCurrency(liveOperations.recordedPayments)} collected against ${formatCurrency(liveOperations.billedRevenue)}`, state: liveOperations.outstandingRevenue > 0 ? 'Scheduled' : 'Ready' },
    ];
  }, [filteredPayments.length, filteredReservations.length, liveOperations, propertyViewOptions, selectedPropertyView]);

  useEffect(() => {
    if (organizationId) {
      void refreshOperationalData().catch(() => undefined);
    }
  }, [organizationId]);

  async function refreshOperationalData() {
    if (!organizationId) return;

    const [reservationRows, folioRows, paymentRows, housekeepingRows] = await Promise.all([
      listVendorPmsRecords('reservations', organizationId),
      listVendorPmsRecords('folios', organizationId),
      listVendorAccountingRecords('payments', organizationId),
      listVendorPmsRecords('housekeeping', organizationId),
    ]);

    setReservations(reservationRows);
    setFolioEntries(folioRows);
    setPayments(paymentRows);
    setHousekeepingTasks(housekeepingRows);
  }

  async function handleSnapshotSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        module: snapshotForm.module,
        snapshot_date: snapshotForm.snapshot_date,
        metric_label: snapshotForm.metric_label,
        metric_value: snapshotForm.metric_value,
      });
      setSnapshotForm({
        module: 'marketplace',
        snapshot_date: '',
        metric_label: '',
        metric_value: '',
      });
      await records.refresh();
      await refreshOperationalData();
      setFormMessage('Analytics snapshot created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create analytics snapshot');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Revenue, conversion, operations, exports
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Analytics & Reporting</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Track executive metrics, branch performance, category growth, operational KPIs, direct-booking value, and export-ready reporting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Building2 className="mr-2 h-4 w-4" />
              Compare Branches
            </Button>
          </div>
        </div>
      </section>

      <AccommodationInsightPanel insight={accommodationInsight} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Multi-Property View</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Roll up live PMS and finance signals across the accommodation portfolio, then narrow to one property when operations need a tighter lens.
            </p>
          </div>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Property focus</span>
            <select
              aria-label="Analytics property focus"
              className="h-11 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={selectedPropertyView}
              onChange={(inputEvent) => setSelectedPropertyView(inputEvent.target.value)}
            >
              <option value="all">All properties</option>
              {propertyViewOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Tracked properties</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{enterpriseSummary.propertyCount}</div>
            <div className="mt-1 text-xs text-slate-500">Properties with live reservation activity</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Ready sites</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{enterpriseSummary.readyProperties}</div>
            <div className="mt-1 text-xs text-slate-500">No queued arrivals or open folio follow-up</div>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Flagged sites</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{enterpriseSummary.flaggedProperties}</div>
            <div className="mt-1 text-xs text-slate-500">Need arrival desk or settlement attention</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Portfolio collections</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(enterpriseSummary.totalCollected)}</div>
            <div className="mt-1 text-xs text-slate-500">Recorded plus pending-approval capture</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Snapshot Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_analytics_snapshots</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Report Snapshot
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[0.65fr_0.65fr_0.8fr_0.65fr_auto]" onSubmit={handleSnapshotSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Module *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={snapshotForm.module}
              onChange={(inputEvent) => setSnapshotForm((current) => ({ ...current, module: inputEvent.target.value }))}
            >
              {analyticsModuleOptions.map((module) => (
                <option key={module} value={module}>
                  {titleCase(module)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Snapshot date *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              type="date"
              value={snapshotForm.snapshot_date}
              onChange={(inputEvent) => setSnapshotForm((current) => ({ ...current, snapshot_date: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Metric label *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Metric"
              required
              value={snapshotForm.metric_label}
              onChange={(inputEvent) => setSnapshotForm((current) => ({ ...current, metric_label: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Metric value *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Value"
              required
              value={snapshotForm.metric_value}
              onChange={(inputEvent) => setSnapshotForm((current) => ({ ...current, metric_value: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Snapshot
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Revenue" value={formatCurrency(liveOperations.billedRevenue || 1840000)} detail={filteredReservations.length > 0 ? 'Reservation billed value' : '+18%'} />
        <Metric label="Bookings" value={filteredReservations.length > 0 ? String(filteredReservations.length) : '1,204'} detail={filteredReservations.length > 0 ? 'Live PMS reservations' : '+11%'} />
        <Metric label="Direct Savings" value={formatCurrency(liveOperations.recordedPayments || 320000)} detail={filteredPayments.length > 0 ? 'Collections tracked' : 'Traveler value'} />
        <Metric label="Exports" value={String(exportRows.length)} detail="Report presets" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Live Operations Pulse</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">Occupancy</div>
              <div className="mt-3 text-3xl font-black text-slate-950">{liveOperations.occupancyRate}%</div>
              <div className="mt-2 text-xs text-slate-500">{liveOperations.occupancyDetail}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">Outstanding Revenue</div>
              <div className="mt-3 text-3xl font-black text-slate-950">{formatCurrency(liveOperations.outstandingRevenue)}</div>
              <div className="mt-2 text-xs text-slate-500">{liveOperations.openFoliosCount} open folio / {liveOperations.settledFoliosCount} settled</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Arrival & Collection Watch</h3>
          </div>
          <div className="space-y-3">
            {liveOperations.nextArrival ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{liveOperations.nextArrival.guest_name}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                      {liveOperations.nextArrival.check_in_date}
                      {' -> '}
                      {liveOperations.nextArrival.check_out_date}
                    </div>
                  </div>
                  <StatePill state="Ready" />
                </div>
                <div className="mt-3 text-lg font-black text-slate-950">{formatCurrency(liveOperations.nextArrival.total_amount)}</div>
                <div className="mt-2 text-xs text-slate-500">Upcoming arrival with payment status {titleCase(liveOperations.nextArrival.payment_status)}</div>
              </div>
            ) : null}
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">
                      {reservations.find((reservation) => reservation.id === payment.reservation_id)?.guest_name || payment.reservation_id || 'Unlinked reservation'}
                    </div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{titleCase(payment.payment_method)}</div>
                  </div>
                  <StatePill state={titleCase(payment.status)} />
                </div>
                <div className="mt-3 text-lg font-black text-slate-950">{formatCurrency(payment.amount)}</div>
              </div>
            ))}
            {!liveOperations.nextArrival && filteredPayments.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                Arrival tracking and collection watch will populate after reservations and payments are created.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ChartNoAxesCombined className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Forecast & Anomaly Desk</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {forecastSignals.map((signal) => (
            <div key={signal.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-black text-slate-950">{signal.title}</div>
                <StatePill state={signal.state} />
              </div>
              <div className="mt-3 text-2xl font-black text-slate-950">{signal.value}</div>
              <div className="mt-2 text-xs font-bold text-slate-500">{signal.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Executive Reports</h3>
          </div>
          <div className="space-y-3">
            {liveSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{snapshot.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{snapshot.date}</div>
                  </div>
                  <StatePill state="Ready" />
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">{snapshot.label}</div>
                <div className="mt-2 text-2xl font-black text-slate-950">{snapshot.value}</div>
              </div>
            ))}
            {executiveReports.map((report) => (
              <div key={report.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{report.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{report.detail}</div>
                  </div>
                  <StatePill state={report.state} />
                </div>
                <div className="mt-3 text-2xl font-black text-slate-950">{report.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Branch Comparison</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {branchInsights.map((branch) => (
              <div key={branch.name} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{branch.name}</div>
                  <StatePill state={branch.state} />
                </div>
                <div className="mt-4 text-2xl font-black text-slate-950">{branch.revenue}</div>
                <div className="mt-2 text-xs font-bold text-emerald-700">{branch.signal}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Category Performance</h3>
          </div>
          <div className="space-y-3">
            {categoryInsights.map((category) => (
              <div key={category.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{category.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{category.detail}</div>
                  </div>
                  <StatePill state={category.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{category.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Operational KPIs</h3>
          </div>
          <div className="space-y-3">
            {operationalMetrics.map((kpi) => (
              <div key={kpi.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="text-sm font-black text-slate-950">{kpi.title}</div>
                <div className="mt-3 text-2xl font-black text-slate-950">{kpi.value}</div>
                <div className="mt-2 text-xs font-bold text-slate-500">{kpi.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Export Center</h3>
          </div>
          <div className="space-y-3">
            {exportRows.map((report) => (
              <div key={report.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{report.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{report.detail}</div>
                  </div>
                  <StatePill state={report.state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {analyticsSignals.map(({ title, detail, icon: Icon }) => (
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
