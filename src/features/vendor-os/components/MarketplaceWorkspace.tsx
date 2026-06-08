import { useMemo, useState, type FormEvent } from 'react';
import {
  BadgePercent,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Layers,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

interface MarketplaceWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
}

const listings = [
  { title: 'Goa Beach Escape', source: 'PMS / Private villa', sync: 'Synced 4m ago', state: 'Live', metric: '7.8% conversion' },
  { title: 'Kerala Houseboat', source: 'PMS / Stay listing', sync: '4 rooms left', state: 'Inventory guarded', metric: '31 saves' },
  { title: 'Luxury SUV Rental', source: 'Fleet / Transport', sync: 'Service blocks protected', state: 'Promoted', metric: 'INR 2,299/day' },
  { title: 'Scuba Diving', source: 'Activities / Slots', sync: '8 seats left', state: 'Selling', metric: 'Safety log due' },
];

const deals = [
  { title: 'Goa Beach Escape', detail: 'Limited-Time Direct Deal', value: '30% off', state: 'Live' },
  { title: 'Dubai Weekend', detail: 'Festival offer scheduled', value: 'Starts tonight', state: 'Scheduled' },
  { title: 'Bali Luxury Villa', detail: 'Direct booking discount', value: 'Save INR 5,500', state: 'Review' },
];

const mappings = [
  { source: 'PMS Rooms', target: 'Stays listings', health: '98% synced', state: 'Protected' },
  { source: 'Tour Departures', target: 'Package cards', health: '2 supplier holds', state: 'Attention' },
  { source: 'Activity Slots', target: 'Experience listings', health: 'Capacity live', state: 'Live' },
  { source: 'Fleet Availability', target: 'Transport cards', health: '1 vehicle blocked', state: 'Guarded' },
];

const publishingQueue = [
  { title: 'Andaman Trip gallery update', detail: '5 photos awaiting approval', state: 'Review' },
  { title: 'Kerala Houseboat blackout', detail: 'Marketplace inventory recalculated', state: 'Synced' },
  { title: 'Luxury SUV permit risk', detail: 'Transport listing partially paused', state: 'Attention' },
];

const conversionSignals = [
  { title: 'Search visibility', value: '82%', detail: '+9% after deal badge' },
  { title: 'Direct savings', value: 'INR 3.2L', detail: 'Traveler value this month' },
  { title: 'Booking lift', value: '+18%', detail: 'Flash sale segments' },
];

const syncSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Inventory source of truth',
    detail: 'Rooms, departures, slots, and vehicles publish from internal capacity instead of manual marketplace edits.',
    icon: Layers,
  },
  {
    title: 'Direct deal engine',
    detail: 'Seasonal, festival, last-minute, and exclusive direct-booking discounts stay tied to real availability.',
    icon: BadgePercent,
  },
  {
    title: 'Publishing governance',
    detail: 'Approval states protect images, pricing, blackout dates, and public listing changes.',
    icon: ShieldCheck,
  },
];

const sourceModuleOptions = ['pms', 'tours', 'activities', 'fleet'];
const syncStatusOptions = ['pending', 'synced', 'failed'];

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function StatePill({ state }: { state: string }) {
  const attention = ['Attention', 'Review', 'Scheduled'].includes(state);
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

export function MarketplaceWorkspace({ organizationId, branchId }: MarketplaceWorkspaceProps) {
  const records = useVendorOSRecords('marketplace', organizationId);
  const mutations = useVendorOSRecordMutations('marketplace', organizationId, branchId);
  const [syncForm, setSyncForm] = useState({
    listing_title: '',
    public_slug: '',
    module: 'pms',
    sync_status: 'pending',
    conversion_rate: '',
    direct_deal_enabled: false,
    deal_badge: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveListings = useMemo(
    () =>
      records.records.map((record) => {
        const metadata =
          record.metadata && typeof record.metadata === 'object' ? (record.metadata as Record<string, unknown>) : {};
        return {
          id: String(record.id),
          title: String(metadata.listing_title || record.title || 'Untitled listing'),
          slug: String(metadata.public_slug || 'Slug pending'),
          dealBadge: metadata.direct_deal_enabled ? `${String(metadata.deal_badge || 'Direct deal')} direct deal` : 'No direct deal',
          source: `${String(record.module || 'marketplace').toUpperCase()} source`,
          sync: String(record.last_synced_at ? `Synced ${record.last_synced_at}` : 'Awaiting marketplace sync'),
          state: titleCase(String(record.sync_status || 'pending')),
          metric:
            record.conversion_rate === null || record.conversion_rate === undefined
              ? 'Conversion pending'
              : `${record.conversion_rate}% conversion`,
        };
      }),
    [records.records],
  );

  async function handleSyncSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        listing_title: syncForm.listing_title,
        public_slug: syncForm.public_slug,
        module: syncForm.module,
        sync_status: syncForm.sync_status,
        conversion_rate: syncForm.conversion_rate ? Number(syncForm.conversion_rate) : null,
        direct_deal_enabled: syncForm.direct_deal_enabled,
        deal_badge: syncForm.deal_badge,
      });
      setSyncForm({
        listing_title: '',
        public_slug: '',
        module: 'pms',
        sync_status: 'pending',
        conversion_rate: '',
        direct_deal_enabled: false,
        deal_badge: '',
      });
      await records.refresh();
      setFormMessage('Listing sync created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create listing sync');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Listings, deals, sync, conversion
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Marketplace Listing Management</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Connect operating inventory to Tripetrip listings, direct deals, publishing approvals, price visibility, and conversion performance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Listing
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Tag className="mr-2 h-4 w-4" />
              Create Flash Sale
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Listing Sync Entry</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_marketplace_syncs</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live Marketplace API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_0.8fr_0.6fr_0.6fr_0.55fr_auto]" onSubmit={handleSyncSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Listing title *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Marketplace listing"
              required
              value={syncForm.listing_title}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, listing_title: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Public slug</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="private-villa-goa"
              value={syncForm.public_slug}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, public_slug: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Source module *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={syncForm.module}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, module: inputEvent.target.value }))}
            >
              {sourceModuleOptions.map((module) => (
                <option key={module} value={module}>
                  {titleCase(module)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Sync status *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={syncForm.sync_status}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, sync_status: inputEvent.target.value }))}
            >
              {syncStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {titleCase(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Conversion rate</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              min="0"
              step="0.1"
              type="number"
              value={syncForm.conversion_rate}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, conversion_rate: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Deal badge</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="30% off"
              value={syncForm.deal_badge}
              onChange={(inputEvent) => setSyncForm((current) => ({ ...current, deal_badge: inputEvent.target.value }))}
            />
          </label>
          <label className="flex h-11 items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 text-xs font-bold text-emerald-800 xl:mt-auto">
            <input
              checked={syncForm.direct_deal_enabled}
              className="h-4 w-4 rounded border-emerald-300 text-emerald-600"
              type="checkbox"
              onChange={(inputEvent) =>
                setSyncForm((current) => ({ ...current, direct_deal_enabled: inputEvent.target.checked }))
              }
            />
            Direct deal enabled
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Listing Sync
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Listings Live" value="24" detail="Synced" />
        <Metric label="Deals Active" value="9" detail="Flash sale" />
        <Metric label="Conversion" value="7.8%" detail="+1.4%" />
        <Metric label="Sync Health" value="98%" detail="Inventory guarded" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Listing Sync Command</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {liveListings.map((listing) => (
              <div key={listing.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{listing.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{listing.source}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">{listing.slug}</div>
                  </div>
                  <StatePill state={listing.state} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {listing.sync}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold text-slate-800">
                  <span>{listing.metric}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] uppercase tracking-widest text-emerald-700">
                    {listing.dealBadge}
                  </span>
                </div>
              </div>
            ))}
            {listings.map((listing) => (
              <div key={listing.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{listing.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{listing.source}</div>
                  </div>
                  <StatePill state={listing.state} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {listing.sync}
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">{listing.metric}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Direct Deals Desk</h3>
          </div>
          <div className="space-y-3">
            {deals.map((deal) => (
              <div key={deal.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{deal.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{deal.detail}</div>
                  </div>
                  <StatePill state={deal.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{deal.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Inventory Mapping</h3>
          </div>
          <div className="space-y-3">
            {mappings.map((mapping) => (
              <div key={mapping.source} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{mapping.source}</div>
                    <div className="mt-1 text-xs text-slate-500">{mapping.target}</div>
                  </div>
                  <StatePill state={mapping.state} />
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">{mapping.health}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Conversion Health</h3>
          </div>
          <div className="space-y-3">
            {conversionSignals.map((signal) => (
              <div key={signal.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="text-sm font-black text-slate-950">{signal.title}</div>
                <div className="mt-3 text-2xl font-black text-slate-950">{signal.value}</div>
                <div className="mt-2 text-xs font-bold text-emerald-700">{signal.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Publishing Queue</h3>
          </div>
          <div className="space-y-3">
            {publishingQueue.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {syncSignals.map(({ title, detail, icon: Icon }) => (
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
