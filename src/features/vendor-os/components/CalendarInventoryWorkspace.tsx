import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Hotel, Map, Mountain, Plus, RefreshCw, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { getAccommodationModuleInsights } from '../accommodationModuleInsights';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import { AccommodationInsightPanel } from './AccommodationInsightPanel';

interface CalendarInventoryWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
  accommodationAccess?: ResolvedVendorAccommodationAccess | null;
}

const calendarDays = [
  { label: 'Today', date: '03 Jun', events: 42, risk: '6 risks', tone: 'attention' },
  { label: 'Thu', date: '04 Jun', events: 38, risk: '2 risks', tone: 'live' },
  { label: 'Fri', date: '05 Jun', events: 56, risk: 'High demand', tone: 'attention' },
  { label: 'Sat', date: '06 Jun', events: 71, risk: 'Peak', tone: 'attention' },
  { label: 'Sun', date: '07 Jun', events: 49, risk: 'Stable', tone: 'live' },
  { label: 'Mon', date: '08 Jun', events: 29, risk: 'Open', tone: 'live' },
  { label: 'Tue', date: '09 Jun', events: 31, risk: 'Open', tone: 'live' },
];

const inventoryLanes = [
  {
    title: 'PMS Rooms',
    icon: Hotel,
    source: 'vendor_rooms + vendor_calendar_events',
    items: [
      { name: 'Manali Hotel', detail: '42 rooms / 83% occupied', status: '6 rooms dirty', value: 'Capacity Risk' },
      { name: 'Goa Villa Desk', detail: '9 villas / 3 available', status: 'Weekend peak', value: 'Raise rate' },
    ],
  },
  {
    title: 'Tour Departures',
    icon: Map,
    source: 'vendor_tour_departures',
    items: [
      { name: 'Kerala Backwaters', detail: '18 guests / 24 capacity', status: 'Guide assigned', value: 'Ready' },
      { name: 'Dubai Weekend', detail: '6 rooms pending', status: 'Supplier hold', value: 'Attention' },
    ],
  },
  {
    title: 'Activity Slots',
    icon: Mountain,
    source: 'vendor_activity_slots',
    items: [
      { name: 'Scuba Diving', detail: '8 seats left / 24 capacity', status: 'Safety log due', value: 'Selling' },
      { name: 'ATV Adventure', detail: '12 seats left', status: 'Gear checked', value: 'Ready' },
    ],
  },
  {
    title: 'Fleet Availability',
    icon: Truck,
    source: 'vendor_vehicle_assignments',
    items: [
      { name: 'Luxury SUV Fleet', detail: '4 vehicles free', status: '1 service due', value: 'Dispatch' },
      { name: 'Airport Transfer Pool', detail: '9 rides assigned', status: 'Drivers covered', value: 'Live' },
    ],
  },
];

const syncEvents = [
  { title: 'Goa villa weekend inventory synced', detail: 'Tripetrip listings updated 4 minutes ago' },
  { title: 'Scuba slot capacity changed', detail: 'Marketplace availability recalculated' },
  { title: 'Luxury SUV blocked for maintenance', detail: 'Transport listing protected from overbooking' },
];

const eventTypeOptions = ['booking', 'blackout', 'departure', 'maintenance'];

function StatusPill({ value }: { value: string }) {
  return (
    <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100">
      {value}
    </span>
  );
}

function formatEventDate(value: unknown) {
  if (!value) return 'No start time';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CalendarInventoryWorkspace({ organizationId, branchId, accommodationAccess }: CalendarInventoryWorkspaceProps) {
  const records = useVendorOSRecords('calendar', organizationId);
  const mutations = useVendorOSRecordMutations('calendar', organizationId, branchId);
  const accommodationInsight = getAccommodationModuleInsights('calendar', accommodationAccess);
  const [eventForm, setEventForm] = useState({
    title: '',
    event_type: 'booking',
    starts_at: '',
    capacity: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveEvents = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        title: String(record.title || 'Untitled event'),
        type: String(record.event_type || 'booking'),
        startsAt: formatEventDate(record.starts_at),
        capacity: record.capacity === null || record.capacity === undefined ? 'Open capacity' : `${record.capacity} capacity`,
        status: String(record.status || 'scheduled'),
      })),
    [records.records],
  );

  async function handleEventSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        title: eventForm.title,
        event_type: eventForm.event_type,
        starts_at: eventForm.starts_at,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : null,
      });
      setEventForm({ title: '', event_type: 'booking', starts_at: '', capacity: '' });
      await records.refresh();
      setFormMessage('Event created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create event');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Capacity control backbone
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Calendar + Live Inventory</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              One operational board for rooms, departures, activity slots, fleet assignments, blackouts, and marketplace sync.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Block Dates
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Marketplace
            </Button>
          </div>
        </div>
      </section>

      <AccommodationInsightPanel insight={accommodationInsight} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Create Calendar Event</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_calendar_events</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live Inventory API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_0.9fr_0.55fr_auto]" onSubmit={handleEventSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Event title *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Inventory event"
              required
              value={eventForm.title}
              onChange={(inputEvent) => setEventForm((current) => ({ ...current, title: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Event type *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={eventForm.event_type}
              onChange={(inputEvent) => setEventForm((current) => ({ ...current, event_type: inputEvent.target.value }))}
            >
              {eventTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Starts at *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              type="datetime-local"
              value={eventForm.starts_at}
              onChange={(inputEvent) => setEventForm((current) => ({ ...current, starts_at: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Capacity</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              min="0"
              placeholder="0"
              type="number"
              value={eventForm.capacity}
              onChange={(inputEvent) => setEventForm((current) => ({ ...current, capacity: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Event
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ['Events Today', '42', 'Across 6 branches'],
          ['Capacity Risk', '6', 'Needs action'],
          ['Blackouts', '3', 'Upcoming'],
          ['Sync Health', '98%', 'Marketplace protected'],
        ].map(([label, value, detail]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{detail}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Unified Availability Board</h3>
        </div>
        {liveEvents.length > 0 && (
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {liveEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="text-sm font-black text-slate-950">{event.title}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{event.type}</div>
                <div className="mt-3 text-sm font-semibold text-slate-600">{event.startsAt}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill value={event.capacity} />
                  <StatusPill value={event.status} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-7">
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 ring-1 ring-slate-100"
            >
              <div className="text-sm font-black text-slate-950">{day.label}</div>
              <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{day.date}</div>
              <div className="mt-5 text-2xl font-black text-slate-950">{day.events}</div>
              <div className={day.tone === 'attention' ? 'mt-2 text-xs font-bold text-rose-600' : 'mt-2 text-xs font-bold text-emerald-600'}>
                {day.risk}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {inventoryLanes.map((lane) => (
          <div key={lane.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <lane.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-950">{lane.title}</h3>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{lane.source}</div>
                </div>
              </div>
              <StatusPill value="Live" />
            </div>
            <div className="space-y-3">
              {lane.items.map((item) => (
                <div key={item.name} className="grid gap-3 rounded-xl bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.detail}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                      {item.value === 'Capacity Risk' || item.value === 'Attention' ? (
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      )}
                      {item.status}
                    </div>
                  </div>
                  <StatusPill value={item.value} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Marketplace Sync Log</h3>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Realtime Ready
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {syncEvents.map((event) => (
            <div key={event.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="text-sm font-black text-slate-950">{event.title}</div>
              <div className="mt-2 text-xs leading-5 text-slate-500">{event.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
