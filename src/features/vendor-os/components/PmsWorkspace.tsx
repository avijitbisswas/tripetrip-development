import { useMemo, useState, type FormEvent } from 'react';
import { BedDouble, CalendarCheck, ClipboardCheck, DoorOpen, FileBadge, Hotel, IndianRupee, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

interface PmsWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
}

const rooms = [
  { room: 'Room 204', type: 'Deluxe Sea View', guest: 'Aarav Mehta', status: 'Ready', housekeeping: 'Clean', rate: 'INR 8,999' },
  { room: 'Room 108', type: 'Garden Suite', guest: 'Checkout pending', status: 'Dirty', housekeeping: 'Deep clean', rate: 'INR 6,499' },
  { room: 'Villa 3', type: 'Private Goa Villa', guest: 'Maya Kapoor', status: 'Occupied', housekeeping: 'Stayover', rate: 'INR 18,000' },
  { room: 'Dorm A-04', type: 'Hostel Bed', guest: 'Available', status: 'Open', housekeeping: 'Clean', rate: 'INR 899' },
  { room: 'Room 301', type: 'Family Suite', guest: 'Priya Sen', status: 'Arrival', housekeeping: 'Inspected', rate: 'INR 11,499' },
  { room: 'Cottage 7', type: 'Mountain Cottage', guest: 'Maintenance hold', status: 'Blocked', housekeeping: 'Repair', rate: 'INR 7,200' },
];

const movements = [
  { guest: 'Aarav Mehta', room: 'Room 204', type: 'Arrival', time: '2:00 PM', docs: 'ID verified' },
  { guest: 'Priya Sen', room: 'Room 301', type: 'Arrival', time: '5:30 PM', docs: '2 IDs pending' },
  { guest: 'Rahul Jain', room: 'Room 108', type: 'Departure', time: '11:00 AM', docs: 'Folio open' },
];

const housekeeping = [
  { task: 'Room 108 deep clean', owner: 'Neha', due: 'Today 1:30 PM', state: 'Due' },
  { task: 'Villa 3 towel refresh', owner: 'Amit', due: 'Today 4:00 PM', state: 'Assigned' },
  { task: 'Cottage 7 repair inspection', owner: 'Ops', due: 'Tomorrow', state: 'Hold' },
];

const documents = [
  { title: 'Aarav Mehta ID', room: 'Room 204', state: 'Verified' },
  { title: 'Priya Sen family IDs', room: 'Room 301', state: 'Pending' },
  { title: 'Villa 3 deposit receipt', room: 'Villa 3', state: 'Attached' },
];

const folios = [
  { title: 'Room 204 folio', value: 'INR 18,400', state: 'Paid advance' },
  { title: 'Room 108 minibar', value: 'INR 2,100', state: 'Post charge' },
  { title: 'Villa 3 weekend rate', value: '+12%', state: 'AI suggested' },
];

const propertyTypeOptions = ['hotel', 'resort', 'homestay', 'hostel', 'villa'];

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-3 text-2xl font-black text-slate-950">{value}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-600">{detail}</div>
    </div>
  );
}

function StatePill({ state }: { state: string }) {
  const attention = ['Dirty', 'Blocked', 'Due', 'Pending', 'Hold'].includes(state);
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

export function PmsWorkspace({ organizationId, branchId }: PmsWorkspaceProps) {
  const records = useVendorOSRecords('pms', organizationId);
  const mutations = useVendorOSRecordMutations('pms', organizationId, branchId);
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    property_type: 'hotel',
    address: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveProperties = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        name: String(record.name || 'Untitled property'),
        propertyType: String(record.property_type || 'property'),
        address: String(record.address || 'No address added'),
        status: record.is_active === false ? 'Inactive' : 'Active',
      })),
    [records.records],
  );

  async function handlePropertySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        name: propertyForm.name,
        property_type: propertyForm.property_type,
        address: propertyForm.address,
      });
      setPropertyForm({ name: '', property_type: 'hotel', address: '' });
      await records.refresh();
      setFormMessage('Property created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create property');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Rooms, guests, housekeeping, folios
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Property Management System</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Run front desk operations across hotels, resorts, villas, hostels, homestays, and serviced properties.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <KeyRound className="mr-2 h-4 w-4" />
              Check In Guest
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Sparkles className="mr-2 h-4 w-4" />
              Optimize Rates
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Create Property</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_properties</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live PMS API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_0.7fr_1.2fr_auto]" onSubmit={handlePropertySubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Property name *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Property name"
              required
              value={propertyForm.name}
              onChange={(inputEvent) => setPropertyForm((current) => ({ ...current, name: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Property type *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={propertyForm.property_type}
              onChange={(inputEvent) => setPropertyForm((current) => ({ ...current, property_type: inputEvent.target.value }))}
            >
              {propertyTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Address</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Property address"
              value={propertyForm.address}
              onChange={(inputEvent) => setPropertyForm((current) => ({ ...current, address: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Property
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Occupancy" value="83%" detail="+9% this week" />
        <Metric label="Arrivals" value="14" detail="Today" />
        <Metric label="Rooms Dirty" value="6" detail="Housekeeping" />
        <Metric label="Open Folios" value="11" detail="Front desk" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Hotel className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Front Desk Command</h3>
        </div>
        {liveProperties.length > 0 && (
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {liveProperties.map((property) => (
              <div key={property.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{property.name}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
                      {property.propertyType}
                    </div>
                  </div>
                  <StatePill state={property.status} />
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-600">{property.address}</div>
              </div>
            ))}
          </div>
        )}
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-950">Room Grid</h4>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {rooms.map((room) => (
                <div key={room.room} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{room.room}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{room.type}</div>
                    </div>
                    <StatePill state={room.status} />
                  </div>
                  <div className="mt-4 text-sm text-slate-600">{room.guest}</div>
                  <div className="mt-3 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{room.housekeeping}</span>
                    <span>{room.rate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-emerald-600" />
              <h4 className="text-sm font-black text-slate-950">Arrivals & Departures</h4>
            </div>
            <div className="space-y-3">
              {movements.map((move) => (
                <div key={`${move.guest}-${move.type}`} className="rounded-xl bg-white p-4 ring-1 ring-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-slate-950">{move.guest}</div>
                    <StatePill state={move.type} />
                  </div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    {move.room} / {move.time}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">{move.docs}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Housekeeping Board</h3>
          </div>
          <div className="space-y-3">
            {housekeeping.map((task) => (
              <div key={task.task} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{task.task}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{task.owner}</div>
                  </div>
                  <StatePill state={task.state} />
                </div>
                <div className="mt-3 text-xs font-bold text-emerald-700">{task.due}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileBadge className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Guest Documents</h3>
          </div>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.title} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div>
                  <div className="text-sm font-black text-slate-950">{doc.title}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{doc.room}</div>
                </div>
                <StatePill state={doc.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Folio & Rates</h3>
          </div>
          <div className="space-y-3">
            {folios.map((folio) => (
              <div key={folio.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{folio.title}</div>
                  <StatePill state={folio.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{folio.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <DoorOpen className="h-5 w-5 text-emerald-700" />
          <div>
            <div className="text-sm font-black text-slate-950">Marketplace inventory guard enabled</div>
            <div className="mt-1 text-sm text-slate-600">
              Dirty, blocked, occupied, and held rooms are protected from direct-booking oversell.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
