import {
  AlertTriangle,
  ClipboardList,
  FileCheck2,
  Map,
  Mountain,
  Route,
  ShieldCheck,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type ToursActivitiesMode = 'tours' | 'activities';

interface ToursActivitiesWorkspaceProps {
  mode: ToursActivitiesMode;
}

const tourDepartures = [
  { title: 'Kerala Backwaters', date: '08 Jun', guests: '18 / 24 guests', guide: 'Anita Nair', status: 'Ready' },
  { title: 'Dubai Weekend', date: '12 Jun', guests: '14 / 18 guests', guide: 'Supplier hold', status: 'Attention' },
  { title: 'Bali Escape', date: '20 Jun', guests: '12 / 20 guests', guide: 'Ravi Shah', status: 'Docs pending' },
];

const guideRoster = [
  { name: 'Anita Nair', skill: 'English / Malayalam', assignment: 'Kerala Backwaters', state: 'Confirmed' },
  { name: 'Ravi Shah', skill: 'English / Hindi', assignment: 'Bali Escape', state: 'Assigned' },
  { name: 'Omar Khan', skill: 'Arabic / English', assignment: 'Dubai Weekend', state: 'Standby' },
];

const activitySlots = [
  { title: 'Scuba Diving', time: 'Today 2:30 PM', capacity: '16 / 24 booked', safety: 'Checklist due', status: 'Selling' },
  { title: 'ATV Adventure', time: 'Tomorrow 10:00 AM', capacity: '8 / 20 booked', safety: 'Gear checked', status: 'Ready' },
  { title: 'Paragliding', time: 'Fri 7:00 AM', capacity: '4 / 8 booked', safety: 'Wind watch', status: 'Attention' },
];

const equipment = [
  { name: 'Scuba tanks', qty: '24 units', condition: '18 filled', state: 'Check' },
  { name: 'ATV helmets', qty: '36 units', condition: 'Ready', state: 'Ready' },
  { name: 'Harness sets', qty: '12 units', condition: '2 inspection due', state: 'Attention' },
];

const manifests = [
  { title: 'Kerala Backwaters manifest', detail: '18 travelers / 3 suppliers / 1 guide', state: 'Export ready' },
  { title: 'Dubai Weekend rooming list', detail: '6 rooms awaiting supplier confirmation', state: 'Attention' },
  { title: 'Bali Escape document pack', detail: '4 passports pending', state: 'Pending' },
];

function StatePill({ state }: { state: string }) {
  const attention = ['Attention', 'Pending', 'Check', 'Docs pending'].includes(state);
  return (
    <span
      className={
        attention
          ? 'w-fit rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase text-rose-700 ring-1 ring-rose-100'
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

export function ToursActivitiesWorkspace({ mode }: ToursActivitiesWorkspaceProps) {
  const isTours = mode === 'tours';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              {isTours ? 'Departures, guides, suppliers, manifests' : 'Slots, safety, waivers, equipment'}
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {isTours ? 'Tour Operator System' : 'Activity Management System'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {isTours
                ? 'Control itineraries, fixed departures, guide rosters, supplier coordination, rooming lists, and traveler manifests.'
                : 'Operate adventure and experience slots with live capacity, safety checks, waiver readiness, and gear control.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              {isTours ? <Route className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              {isTours ? 'Create Departure' : 'Log Safety Check'}
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <FileCheck2 className="mr-2 h-4 w-4" />
              {isTours ? 'Export Manifest' : 'Export Waivers'}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label={isTours ? 'Departures' : 'Slots Selling'} value={isTours ? '12' : '31'} detail={isTours ? 'This week' : 'Live'} />
        <Metric label={isTours ? 'Guides Assigned' : 'Safety Logs'} value={isTours ? '18' : '4'} detail={isTours ? 'Ready' : 'Due'} />
        <Metric label={isTours ? 'Manifest Gaps' : 'Gear Ready'} value={isTours ? '2' : '92%'} detail={isTours ? 'Fix today' : 'Checked'} />
        <Metric label="Marketplace Sync" value="98%" detail="Inventory guarded" />
      </section>

      {isTours ? (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Map className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Departure Control</h3>
            </div>
            <div className="space-y-3">
              {tourDepartures.map((departure) => (
                <div key={departure.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{departure.title}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                        {departure.date} / {departure.guests}
                      </div>
                    </div>
                    <StatePill state={departure.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    {departure.guide}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Guide Roster</h3>
            </div>
            <div className="space-y-3">
              {guideRoster.map((guide) => (
                <div key={guide.name} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{guide.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{guide.skill}</div>
                    </div>
                    <StatePill state={guide.state} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-700">{guide.assignment}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Slot Control</h3>
            </div>
            <div className="space-y-3">
              {activitySlots.map((slot) => (
                <div key={slot.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{slot.title}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                        {slot.time} / {slot.capacity}
                      </div>
                    </div>
                    <StatePill state={slot.status} />
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    {slot.status === 'Attention' ? (
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    )}
                    {slot.safety}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Mountain className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Equipment Readiness</h3>
            </div>
            <div className="space-y-3">
              {equipment.map((item) => (
                <div key={item.name} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.qty}</div>
                    </div>
                    <StatePill state={item.state} />
                  </div>
                  <div className="mt-3 text-sm font-bold text-slate-700">{item.condition}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Group Manifest</h3>
          </div>
          <div className="space-y-3">
            {manifests.map((manifest) => (
              <div key={manifest.title} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div>
                  <div className="text-sm font-black text-slate-950">{manifest.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{manifest.detail}</div>
                </div>
                <StatePill state={manifest.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Safety Desk</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['Waivers', isTours ? 'Traveler declarations ready' : '18 signed'],
              ['Emergency Plan', 'Guide briefing attached'],
              ['Supplier Checks', isTours ? 'Hotel and transfer holds tracked' : 'Gear and instructor checks logged'],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="text-sm font-black text-slate-950">{title}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
