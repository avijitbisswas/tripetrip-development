import { useMemo, useState, type FormEvent } from 'react';
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
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

interface AnalyticsWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
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

export function AnalyticsWorkspace({ organizationId, branchId }: AnalyticsWorkspaceProps) {
  const records = useVendorOSRecords('analytics', organizationId);
  const mutations = useVendorOSRecordMutations('analytics', organizationId, branchId);
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
        <Metric label="Revenue" value="INR 18.4L" detail="+18%" />
        <Metric label="Bookings" value="1,204" detail="+11%" />
        <Metric label="Direct Savings" value="INR 3.2L" detail="Traveler value" />
        <Metric label="Exports" value="12" detail="This month" />
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
            {branches.map((branch) => (
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
            {categories.map((category) => (
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
            {operationalKpis.map((kpi) => (
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
            {exports.map((report) => (
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
