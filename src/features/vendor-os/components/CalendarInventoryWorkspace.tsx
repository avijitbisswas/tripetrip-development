import { AlertTriangle, CalendarDays, CheckCircle2, Hotel, Map, Mountain, Plus, RefreshCw, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

function StatusPill({ value }: { value: string }) {
  return (
    <span className="w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100">
      {value}
    </span>
  );
}

export function CalendarInventoryWorkspace() {
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
