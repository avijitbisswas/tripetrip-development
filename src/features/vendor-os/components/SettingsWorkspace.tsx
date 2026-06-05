import { useMemo, useState, type FormEvent } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  Globe,
  KeyRound,
  LockKeyhole,
  Plug,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import type { VendorOSModule } from '../types';

interface SettingsWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
}

const moduleOptions: VendorOSModule[] = [
  'crm',
  'calendar',
  'inbox',
  'pms',
  'tours',
  'activities',
  'fleet',
  'marketplace',
  'documents',
  'analytics',
  'ai_assistant',
];

const profileSettings = [
  { title: 'Business profile', detail: 'Legal name, brand assets, timezone, currency, and marketplace identity.', state: 'Configured' },
  { title: 'Branch defaults', detail: 'Default country, branch inheritance, manager ownership, and local tax settings.', state: 'Ready' },
  { title: 'Marketplace behavior', detail: 'Direct booking policy, public listing visibility, and supplier profile rules.', state: 'Active' },
];

const integrations = [
  { title: 'Payment gateway', detail: 'Razorpay/Stripe credentials and webhook state.', state: 'Credential required' },
  { title: 'Maps and location', detail: 'Mapbox token and branch geocoding defaults.', state: 'Available' },
  { title: 'AI operations', detail: 'Provider keys, usage limits, assistant modules, and audit policy.', state: 'Controlled' },
];

const policies = [
  { title: 'Approval workflow', detail: 'Require owner/admin approval for pricing, public listing, and payout changes.', icon: ShieldCheck },
  { title: 'Notification defaults', detail: 'Control branch alerts, expiry reminders, booking notices, and escalation windows.', icon: Bell },
  { title: 'Data access policy', detail: 'Keep module access, branch scope, and sensitive document permissions aligned.', icon: LockKeyhole },
];

const settingSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Tenant controlled',
    detail: 'Settings are scoped by organization and optionally branch, so HQ and local offices can use different controls.',
    icon: Building2,
  },
  {
    title: 'Integration ready',
    detail: 'The interface separates credential-driven integrations from module toggles so real providers can be added cleanly.',
    icon: Plug,
  },
  {
    title: 'Permission aware',
    detail: 'Settings sits behind owner/admin permissions in RLS and can be paired with the RBAC editor later.',
    icon: KeyRound,
  },
];

const fallbackSettings = [
  { id: 'demo-pms', module: 'pms', is_enabled: true, note: 'Front desk and room inventory enabled for active branches.' },
  { id: 'demo-marketplace', module: 'marketplace', is_enabled: true, note: 'Listings and Limited-Time Direct Deals can sync.' },
  { id: 'demo-ai', module: 'ai_assistant', is_enabled: false, note: 'Enable after provider credentials and spend limits are approved.' },
];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function settingNote(settings: unknown) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return 'No policy note';
  const note = (settings as Record<string, unknown>).policy_note;
  return note ? String(note) : 'No policy note';
}

function StatePill({ state }: { state: string }) {
  const attention = ['Credential required', 'Disabled'].includes(state);
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

export function SettingsWorkspace({ organizationId, branchId }: SettingsWorkspaceProps) {
  const records = useVendorOSRecords('settings', organizationId);
  const mutations = useVendorOSRecordMutations('settings', organizationId, branchId);
  const [settingForm, setSettingForm] = useState({
    module: 'crm',
    enabled: 'true',
    policy_note: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const liveSettings = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        module: String(record.module || 'settings'),
        is_enabled: record.is_enabled !== false,
        note: settingNote(record.settings),
      })),
    [records.records],
  );
  const displayedSettings = liveSettings.length ? liveSettings : fallbackSettings;
  const enabledCount = displayedSettings.filter((setting) => setting.is_enabled).length;

  async function handleSettingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        module: settingForm.module,
        is_enabled: settingForm.enabled === 'true',
        settings: { policy_note: settingForm.policy_note },
      });
      setSettingForm({
        module: 'crm',
        enabled: 'true',
        policy_note: '',
      });
      await records.refresh();
      setFormMessage('Setting saved');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to save setting');
    }
  }

  async function handleToggle(settingId: string, isEnabled: boolean) {
    setFormMessage(null);
    try {
      await mutations.updateRecord(settingId, { is_enabled: !isEnabled });
      await records.refresh();
      setFormMessage('Setting updated');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to update setting');
    }
  }

  async function handleRemove(settingId: string) {
    setFormMessage(null);
    try {
      await mutations.deleteRecord(settingId);
      await records.refresh();
      setFormMessage('Setting removed');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to remove setting');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Business profile, modules, integrations, policies
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Settings</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Configure tenant identity, branch defaults, module availability, integration readiness, and operating policies.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <Settings2 className="mr-2 h-4 w-4" />
              Configure Tenant
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Globe className="mr-2 h-4 w-4" />
              Integration Keys
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Module Setting Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_os_module_settings</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            CRUD Enabled
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[0.7fr_0.55fr_1fr_auto]" onSubmit={handleSettingSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Module *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={settingForm.module}
              onChange={(inputEvent) => setSettingForm((current) => ({ ...current, module: inputEvent.target.value }))}
            >
              {moduleOptions.map((module) => (
                <option key={module} value={module}>
                  {titleCase(module)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Enabled *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={settingForm.enabled}
              onChange={(inputEvent) => setSettingForm((current) => ({ ...current, enabled: inputEvent.target.value }))}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Policy note</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Approval rule, integration status, or branch policy"
              value={settingForm.policy_note}
              onChange={(inputEvent) => setSettingForm((current) => ({ ...current, policy_note: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Save Setting
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Enabled modules" value={String(enabledCount)} detail="Settings active" />
        <Metric label="Scope" value={branchId ? 'Branch' : 'Org'} detail="Control layer" />
        <Metric label="Policies" value="3" detail="Governed" />
        <Metric label="Integrations" value="Ready" detail="Credentials separated" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Module Controls</h3>
              <p className="mt-1 text-xs font-semibold text-slate-400">Toggle or remove live module settings</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{displayedSettings.length} tracked</span>
          </div>
          <div className="space-y-3">
            {displayedSettings.map((setting) => {
              const moduleName = titleCase(setting.module);
              const canMutate = !setting.id.startsWith('demo-');
              return (
                <div
                  key={setting.id}
                  className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[0.5fr_1fr_auto_auto_auto] md:items-center"
                >
                  <div className="text-sm font-black text-slate-950">{moduleName}</div>
                  <div className="text-sm leading-6 text-slate-500">{setting.note}</div>
                  <StatePill state={setting.is_enabled ? 'Enabled' : 'Disabled'} />
                  <Button
                    className="rounded-xl text-xs font-bold uppercase tracking-widest"
                    disabled={!canMutate || mutations.submitting}
                    onClick={() => handleToggle(setting.id, setting.is_enabled)}
                    type="button"
                    variant="outline"
                  >
                    {setting.is_enabled ? `Disable ${moduleName}` : `Enable ${moduleName}`}
                  </Button>
                  <Button
                    className="rounded-xl text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-700"
                    disabled={!canMutate || mutations.submitting}
                    onClick={() => handleRemove(setting.id)}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove {moduleName} setting
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Business Profile</h3>
          <div className="mt-4 space-y-3">
            {profileSettings.map((setting) => (
              <div key={setting.title} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{setting.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{setting.detail}</p>
                  </div>
                  <StatePill state={setting.state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Integrations</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {integrations.map((integration) => (
              <div key={integration.title} className="rounded-xl bg-slate-50 p-4">
                <Plug className="h-5 w-5 text-emerald-700" />
                <div className="mt-3 text-sm font-black text-slate-950">{integration.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{integration.detail}</p>
                <div className="mt-4">
                  <StatePill state={integration.state} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Policy Center</h3>
          <div className="mt-4 space-y-3">
            {policies.map((policy) => {
              const Icon = policy.icon;
              return (
                <div key={policy.title} className="rounded-xl bg-emerald-50 p-4">
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <div className="mt-3 text-sm font-black text-slate-950">{policy.title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{policy.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {settingSignals.map((signal) => {
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
