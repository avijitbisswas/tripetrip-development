import { useMemo, useState, type FormEvent } from 'react';
import {
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarClock,
  CreditCard,
  Gauge,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

interface SubscriptionWorkspaceProps {
  organizationId?: string;
}

const usageMeters = [
  { label: 'Listings', value: '24 / 40', detail: '60% used', state: 'Healthy' },
  { label: 'Team seats', value: '19 / 25', detail: '6 seats free', state: 'Healthy' },
  { label: 'AI credits', value: '820 / 1,200', detail: '68% used', state: 'Monitor' },
  { label: 'Storage', value: '68%', detail: 'Document vault', state: 'Healthy' },
];

const addOns = [
  { title: 'AI Operations Assistant', detail: 'Daily brief, replies, pricing suggestions', value: 'Enabled', state: 'Active' },
  { title: 'Advanced Analytics', detail: 'Branch exports and conversion reporting', value: 'Trial', state: 'Review' },
  { title: 'Extra document storage', detail: 'Compliance vault expansion', value: '50 GB', state: 'Active' },
];

const entitlements = [
  { branch: 'Manali Hotel', modules: 'PMS, CRM, Calendar, Analytics', state: 'Enabled' },
  { branch: 'Goa Villa Desk', modules: 'Marketplace, Fleet, Deals, PMS', state: 'Enabled' },
  { branch: 'Rishikesh Base', modules: 'Activities, Fleet, Documents', state: 'Limited' },
];

const billingEvents = [
  { title: 'Growth Plan renewal', detail: 'Next invoice on 30 Jun 2026', amount: 'INR 7,999', state: 'Scheduled' },
  { title: 'AI credits add-on', detail: 'Usage pack active until renewal', amount: 'INR 1,499', state: 'Active' },
  { title: 'Seat expansion', detail: '5 seats added this cycle', amount: 'INR 2,000', state: 'Billed' },
];

const planSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Module entitlements',
    detail: 'Subscription state controls which Vendor OS modules, branches, seats, and add-ons are available.',
    icon: ShieldCheck,
  },
  {
    title: 'Usage-aware upgrades',
    detail: 'Plan recommendations can be triggered by listings, bookings, AI credits, storage, branches, and seats.',
    icon: Gauge,
  },
  {
    title: 'Billing-provider ready',
    detail: 'The workspace is structured for future payment provider events while keeping current state auditable.',
    icon: CreditCard,
  },
];

const planOptions = ['starter', 'growth', 'scale', 'enterprise'];
const billingCycleOptions = ['monthly', 'annual'];
const subscriptionStatusOptions = ['active', 'trialing', 'past_due', 'cancelled'];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function StatePill({ state }: { state: string }) {
  const attention = ['Monitor', 'Review', 'Scheduled', 'Limited'].includes(state);
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

export function SubscriptionWorkspace({ organizationId }: SubscriptionWorkspaceProps) {
  const records = useVendorOSRecords('subscriptions', organizationId);
  const mutations = useVendorOSRecordMutations('subscriptions', organizationId, null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_code: 'growth',
    billing_cycle: 'monthly',
    status: 'active',
    team_seats: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveSubscriptions = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        plan: `${titleCase(String(record.plan_code || 'growth'))} Plan`,
        billing: `${titleCase(String(record.billing_cycle || 'monthly'))} billing`,
        seats:
          record.team_seats === null || record.team_seats === undefined
            ? 'Seats not configured'
            : `${record.team_seats} team seats`,
        state: titleCase(String(record.status || 'active')),
      })),
    [records.records],
  );

  async function handleSubscriptionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        plan_code: subscriptionForm.plan_code,
        billing_cycle: subscriptionForm.billing_cycle,
        status: subscriptionForm.status,
        team_seats: subscriptionForm.team_seats ? Number(subscriptionForm.team_seats) : null,
      });
      setSubscriptionForm({
        plan_code: 'growth',
        billing_cycle: 'monthly',
        status: 'active',
        team_seats: '',
      });
      await records.refresh();
      setFormMessage('Subscription created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create subscription');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Plans, usage, billing, entitlements
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Subscription Management</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Manage vendor plans, billing status, usage limits, add-ons, branch entitlements, renewal events, and upgrade controls.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <WalletCards className="mr-2 h-4 w-4" />
              Change Plan
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Users className="mr-2 h-4 w-4" />
              Add Seats
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Subscription Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_subscription_accounts</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Organization Scoped
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[0.7fr_0.65fr_0.65fr_0.5fr_auto]" onSubmit={handleSubscriptionSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Plan code *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={subscriptionForm.plan_code}
              onChange={(inputEvent) => setSubscriptionForm((current) => ({ ...current, plan_code: inputEvent.target.value }))}
            >
              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {titleCase(plan)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Billing cycle *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={subscriptionForm.billing_cycle}
              onChange={(inputEvent) => setSubscriptionForm((current) => ({ ...current, billing_cycle: inputEvent.target.value }))}
            >
              {billingCycleOptions.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {titleCase(cycle)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={subscriptionForm.status}
              onChange={(inputEvent) => setSubscriptionForm((current) => ({ ...current, status: inputEvent.target.value }))}
            >
              {subscriptionStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Team seats</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              min="1"
              type="number"
              value={subscriptionForm.team_seats}
              onChange={(inputEvent) => setSubscriptionForm((current) => ({ ...current, team_seats: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Subscription
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Plan" value="Growth" detail="Active" />
        <Metric label="Usage" value="68%" detail="Healthy" />
        <Metric label="Add-ons" value="3" detail="Enabled" />
        <Metric label="Renewal" value="30 Jun" detail="Scheduled" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Plan Control</h3>
          </div>
          {liveSubscriptions.map((subscription) => (
            <div key={subscription.id} className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-2xl font-black text-slate-950">{subscription.plan}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">{subscription.billing}</div>
                </div>
                <StatePill state={subscription.state} />
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-700">
                <Users className="h-4 w-4 text-emerald-600" />
                {subscription.seats}
              </div>
            </div>
          ))}
          <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-black text-slate-950">Growth Plan</div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  Multi-branch operations with marketplace sync, PMS, fleet, activities, documents, and AI add-ons.
                </div>
              </div>
              <StatePill state="Active" />
            </div>
            <div className="mt-5 grid gap-3 text-sm font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                6 branches included
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                25 team seats included
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                1,200 AI credits / month
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Usage Metering</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {usageMeters.map((meter) => (
              <div key={meter.label} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{meter.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{meter.detail}</div>
                  </div>
                  <StatePill state={meter.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{meter.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <PackagePlus className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Add-ons & Limits</h3>
          </div>
          <div className="space-y-3">
            {addOns.map((addOn) => (
              <div key={addOn.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{addOn.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{addOn.detail}</div>
                  </div>
                  <StatePill state={addOn.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{addOn.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Branch Entitlements</h3>
          </div>
          <div className="space-y-3">
            {entitlements.map((entitlement) => (
              <div key={entitlement.branch} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{entitlement.branch}</div>
                    <div className="mt-1 text-xs text-slate-500">{entitlement.modules}</div>
                  </div>
                  <StatePill state={entitlement.state} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Billing Events</h3>
          </div>
          <div className="space-y-3">
            {billingEvents.map((event) => (
              <div key={event.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{event.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{event.detail}</div>
                  </div>
                  <StatePill state={event.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{event.amount}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {planSignals.map(({ title, detail, icon: Icon }) => (
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
