import { useMemo, useState, type FormEvent } from 'react';
import {
  Building2,
  ClipboardCheck,
  MapPin,
  Network,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import type { VendorOSModule } from '../types';

interface BranchWorkspaceProps {
  organizationId?: string;
}

const branchRegistry = [
  { name: 'Manali Hotel', location: 'Manali, India', mix: 'Hotel + tours', metric: '83% occupancy', state: 'Active' },
  { name: 'Goa Villa Desk', location: 'Goa, India', mix: 'Villas + fleet', metric: '18 deals live', state: 'Active' },
  { name: 'Rishikesh Base', location: 'Rishikesh, India', mix: 'Activities + transport', metric: '42 slots today', state: 'Active' },
];

const categoryMix = [
  { title: 'Stay Inventory', detail: 'Hotels, resorts, homestays, hostels, villas, room blocks', value: '9 branches' },
  { title: 'Experience Supply', detail: 'Tours, departures, activity slots, guides, safety readiness', value: '6 branches' },
  { title: 'Mobility Desk', detail: 'Fleet, drivers, permits, maintenance, branch dispatch windows', value: '4 branches' },
];

const localControls = [
  { title: 'Branch Managers', detail: 'Assign local owners while keeping HQ-level oversight.', icon: Users },
  { title: 'Module Access', detail: 'Enable PMS, tours, activities, fleet, marketplace, and analytics per branch.', icon: SlidersHorizontal },
  { title: 'Local Compliance', detail: 'Track licenses, permits, insurance, GST, safety documents, and expiries.', icon: ShieldCheck },
];

const operatingPolicies = [
  { title: 'Shared CRM pipeline', detail: 'Leads can be routed to branch teams without losing organization-level visibility.' },
  { title: 'Branch scoped inventory', detail: 'Calendar, PMS, tours, activities, and fleet records stay scoped to the active branch.' },
  { title: 'HQ audit trail', detail: 'Every branch action can flow into audit logs, notifications, and reporting.' },
];

const branchModuleOptions: VendorOSModule[] = ['crm', 'calendar', 'pms', 'tours', 'activities', 'fleet', 'marketplace', 'documents'];

const branchSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Multi-category ready',
    detail: 'One vendor can run hotel, DMC, adventure, activity, and transport operations from the same organization.',
    icon: Network,
  },
  {
    title: 'Marketplace linked',
    detail: 'Branch inventory can feed direct deals, listings, availability, rates, and conversion reporting.',
    icon: Building2,
  },
  {
    title: 'Operational controls',
    detail: 'Designed for branch-level roles, module controls, policy settings, and local document accountability.',
    icon: Settings2,
  },
];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function StatePill({ state }: { state: string }) {
  const inactive = state.toLowerCase() === 'inactive';
  return (
    <span
      className={
        inactive
          ? 'w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase text-slate-500 ring-1 ring-slate-200'
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

export function BranchWorkspace({ organizationId }: BranchWorkspaceProps) {
  const records = useVendorOSRecords('branches', organizationId);
  const settings = useVendorOSRecords('settings', organizationId);
  const mutations = useVendorOSRecordMutations('branches', organizationId, null);
  const [selectedControlBranchId, setSelectedControlBranchId] = useState('');
  const settingsMutations = useVendorOSRecordMutations('settings', organizationId, selectedControlBranchId || null);
  const [branchForm, setBranchForm] = useState({
    name: '',
    city: '',
    country: '',
    status: 'active',
  });
  const [controlForm, setControlForm] = useState({
    module: 'pms',
    enabled: 'true',
    policy_note: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const liveBranches = useMemo(
    () =>
      records.records.map((record) => {
        const location = [record.city, record.country].filter(Boolean).map(String).join(', ');
        return {
          id: String(record.id),
          name: String(record.name || 'Untitled branch'),
          location: location || 'Location pending',
          mix: Array.isArray(record.categories) && record.categories.length ? record.categories.map(String).map(titleCase).join(' + ') : 'Modules pending',
          metric: record.branch_code ? `Code ${record.branch_code}` : 'Live branch',
          state: record.is_active === false ? 'Inactive' : 'Active',
        };
      }),
    [records.records],
  );
  const displayedBranches = liveBranches.length ? liveBranches : branchRegistry;
  const branchOptions = liveBranches.map((branch) => ({ id: branch.id, name: branch.name }));
  const liveBranchControls = useMemo(
    () =>
      settings.records
        .filter((record) => record.branch_id)
        .map((record) => {
          const note =
            record.settings && typeof record.settings === 'object' && !Array.isArray(record.settings)
              ? String((record.settings as Record<string, unknown>).policy_note || 'No branch policy note')
              : 'No branch policy note';
          const branchName = branchOptions.find((branch) => branch.id === String(record.branch_id))?.name || 'Branch scoped';
          return {
            id: String(record.id),
            branchName,
            module: titleCase(String(record.module || 'settings')),
            state: record.is_enabled === false ? 'Disabled' : 'Enabled',
            note,
          };
        }),
    [branchOptions, settings.records],
  );

  async function handleBranchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        name: branchForm.name,
        city: branchForm.city,
        country: branchForm.country,
        is_active: branchForm.status === 'active',
      });
      setBranchForm({
        name: '',
        city: '',
        country: '',
        status: 'active',
      });
      await records.refresh();
      setFormMessage('Branch created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create branch');
    }
  }

  async function handleControlSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await settingsMutations.createRecord({
        branch_id: selectedControlBranchId,
        module: controlForm.module,
        is_enabled: controlForm.enabled === 'true',
        settings: { policy_note: controlForm.policy_note, source: 'branch_workspace' },
      });
      setControlForm({
        module: 'pms',
        enabled: 'true',
        policy_note: '',
      });
      await settings.refresh();
      setFormMessage('Branch control saved');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to save branch control');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Organization, branches, local controls
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Multi-branch Support</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Operate hotels, resorts, homestays, hostels, tours, activities, DMC desks, and fleet branches under one tenant.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <Building2 className="mr-2 h-4 w-4" />
              Add Branch
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Assign Manager
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Branch Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_branches</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Organization Scoped
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_0.7fr_0.7fr_0.55fr_auto]" onSubmit={handleBranchSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Branch name *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={branchForm.name}
              onChange={(inputEvent) => setBranchForm((current) => ({ ...current, name: inputEvent.target.value }))}
              placeholder="Goa Villa Desk"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">City</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={branchForm.city}
              onChange={(inputEvent) => setBranchForm((current) => ({ ...current, city: inputEvent.target.value }))}
              placeholder="Goa"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Country</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={branchForm.country}
              onChange={(inputEvent) => setBranchForm((current) => ({ ...current, country: inputEvent.target.value }))}
              placeholder="India"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={branchForm.status}
              onChange={(inputEvent) => setBranchForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Branch
          </Button>
        </form>
        {(formMessage || mutations.error || settingsMutations.error || records.error || settings.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">
            {formMessage || mutations.error || settingsMutations.error || records.error || settings.error}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Branch Module Controls</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_os_module_settings</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Branch Scoped
          </span>
        </div>
        <form className="grid gap-3 lg:grid-cols-[0.8fr_0.7fr_0.6fr_1fr_auto]" onSubmit={handleControlSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Control branch *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={selectedControlBranchId}
              onChange={(inputEvent) => setSelectedControlBranchId(inputEvent.target.value)}
            >
              <option value="">Select branch</option>
              {branchOptions.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Control module *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={controlForm.module}
              onChange={(inputEvent) => setControlForm((current) => ({ ...current, module: inputEvent.target.value }))}
            >
              {branchModuleOptions.map((module) => (
                <option key={module} value={module}>
                  {titleCase(module)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Module enabled *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={controlForm.enabled}
              onChange={(inputEvent) => setControlForm((current) => ({ ...current, enabled: inputEvent.target.value }))}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Branch policy note</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Local module rule"
              value={controlForm.policy_note}
              onChange={(inputEvent) => setControlForm((current) => ({ ...current, policy_note: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={settingsMutations.submitting || !organizationId || !selectedControlBranchId}
            type="submit"
          >
            Save Branch Control
          </Button>
        </form>
        {liveBranchControls.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {liveBranchControls.map((control) => (
              <div key={control.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{control.branchName}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{control.module}</div>
                  </div>
                  <StatePill state={control.state} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">{control.note}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Branches" value={String(displayedBranches.length)} detail="Tracked" />
        <Metric label="Categories" value="10" detail="Multi-category vendor" />
        <Metric label="Controls" value="RBAC" detail="Branch aware" />
        <Metric label="Marketplace" value="Live" detail="Inventory linked" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Branch Registry</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">Live branches appear here after creation</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{displayedBranches.length} tracked</span>
          </div>
          <div className="space-y-3">
            {displayedBranches.map((branch) => (
              <div
                key={`${branch.name}-${branch.location}`}
                className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-center"
              >
                <div>
                  <div className="text-sm font-black text-slate-950">{branch.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {branch.location}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-600">{branch.mix}</div>
                <div className="text-sm font-bold text-slate-900">{branch.metric}</div>
                <StatePill state={branch.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Category Mix</h3>
          <div className="mt-4 space-y-3">
            {categoryMix.map((category) => (
              <div key={category.title} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{category.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{category.detail}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100">
                    {category.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Local Controls</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {localControls.map((control) => {
              const Icon = control.icon;
              return (
                <div key={control.title} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-sm font-black text-slate-950">{control.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{control.detail}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Operating Policies</h3>
          <div className="mt-4 space-y-3">
            {operatingPolicies.map((policy) => (
              <div key={policy.title} className="rounded-xl bg-emerald-50 p-4">
                <div className="text-sm font-black text-slate-950">{policy.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{policy.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {branchSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <div key={signal.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-sm font-black text-slate-950">{signal.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{signal.detail}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
