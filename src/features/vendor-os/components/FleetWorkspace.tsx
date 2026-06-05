import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  FileBadge,
  Fuel,
  Gauge,
  MapPin,
  ShieldCheck,
  Truck,
  UserCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';

interface FleetWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
}

const vehicles = [
  { name: 'Toyota Innova', route: 'Airport transfer', driver: 'Amit Das', status: 'Assigned', seats: '6 seats' },
  { name: 'Luxury SUV', route: 'Goa rental', driver: 'Ravi Khan', status: 'Service due', seats: '4 seats' },
  { name: 'Tempo Traveller', route: 'Kerala group tour', driver: 'Neha Pillai', status: 'Available', seats: '12 seats' },
  { name: 'Royal Enfield 350', route: 'Manali self-drive', driver: 'Depot hold', status: 'Ready', seats: '1 rider' },
];

const drivers = [
  { name: 'Amit Das', duty: 'BLR airport pickup', license: 'Valid till 2027', state: 'On duty' },
  { name: 'Ravi Khan', duty: 'Goa SUV rental', license: 'Insurance check', state: 'Attention' },
  { name: 'Neha Pillai', duty: 'Kerala group tour', license: 'Verified', state: 'Standby' },
];

const maintenance = [
  { title: 'Luxury SUV oil service', meta: 'Due at 42,000 km', value: 'Tomorrow', state: 'Due' },
  { title: 'Toyota Innova fuel log', meta: 'Last fill 38 liters', value: 'INR 3,914', state: 'Logged' },
  { title: 'Tempo Traveller tyre check', meta: 'Pre-trip inspection', value: '6 Jun', state: 'Scheduled' },
];

const permits = [
  { title: 'Luxury SUV insurance', detail: 'Expires in 18 days', state: 'Attention' },
  { title: 'Tempo Traveller tourist permit', detail: 'Valid across Kerala + Tamil Nadu', state: 'Active' },
  { title: 'Driver KYC pack', detail: '3 drivers verified', state: 'Verified' },
];

const manifests = [
  { title: 'Airport pickup manifest', detail: 'Toyota Innova / 2 adults / 2 bags', state: 'Ready' },
  { title: 'Kerala group transfer', detail: 'Tempo Traveller / 11 guests / guide attached', state: 'Assigned' },
  { title: 'Goa SUV rental handover', detail: 'Fuel deposit and ID copy pending', state: 'Pending' },
];

const readinessSignals: Array<{ title: string; detail: string; icon: LucideIcon }> = [
  {
    title: 'Marketplace oversell guard',
    detail: 'Vehicles in service, duty, or permit risk are blocked from transport listings.',
    icon: ShieldCheck,
  },
  {
    title: 'Route readiness',
    detail: 'Driver, fuel, permit, and passenger manifest are checked before dispatch.',
    icon: Gauge,
  },
  {
    title: 'Compliance alerts',
    detail: 'Insurance, permits, pollution certificates, and driver papers trigger document reminders.',
    icon: AlertTriangle,
  },
];

const vehicleTypeOptions = ['suv', 'sedan', 'tempo', 'bike', 'bus'];

function StatePill({ state }: { state: string }) {
  const attention = ['Attention', 'Due', 'Pending', 'Service due'].includes(state);
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

export function FleetWorkspace({ organizationId, branchId }: FleetWorkspaceProps) {
  const records = useVendorOSRecords('fleet', organizationId);
  const mutations = useVendorOSRecordMutations('fleet', organizationId, branchId);
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    vehicle_type: 'suv',
    registration_number: '',
    seats: '',
  });
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const liveVehicles = useMemo(
    () =>
      records.records.map((record) => ({
        id: String(record.id),
        name: String(record.name || 'Untitled vehicle'),
        type: String(record.vehicle_type || 'vehicle'),
        registration: String(record.registration_number || 'No registration'),
        seats: record.seats === null || record.seats === undefined ? 'Seats not set' : `${record.seats} seats`,
        status: String(record.status || 'available'),
      })),
    [records.records],
  );

  async function handleVehicleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    try {
      await mutations.createRecord({
        name: vehicleForm.name,
        vehicle_type: vehicleForm.vehicle_type,
        registration_number: vehicleForm.registration_number,
        seats: vehicleForm.seats ? Number(vehicleForm.seats) : null,
      });
      setVehicleForm({ name: '', vehicle_type: 'suv', registration_number: '', seats: '' });
      await records.refresh();
      setFormMessage('Vehicle created');
    } catch (err) {
      setFormMessage(err instanceof Error ? err.message : 'Unable to create vehicle');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              Vehicles, drivers, duty, compliance
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Fleet Management System</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Operate transport inventory with vehicle assignment, driver duty, permits, fuel logs, maintenance, and trip manifests.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">
              <Truck className="mr-2 h-4 w-4" />
              Assign Vehicle
            </Button>
            <Button variant="outline" className="rounded-xl text-xs font-bold uppercase tracking-widest">
              <Fuel className="mr-2 h-4 w-4" />
              Add Fuel Log
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Create Vehicle</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_vehicles</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Live Fleet API
          </span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_0.65fr_0.85fr_0.45fr_auto]" onSubmit={handleVehicleSubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Vehicle name *</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Vehicle name"
              required
              value={vehicleForm.name}
              onChange={(inputEvent) => setVehicleForm((current) => ({ ...current, name: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Vehicle type *</span>
            <select
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              required
              value={vehicleForm.vehicle_type}
              onChange={(inputEvent) => setVehicleForm((current) => ({ ...current, vehicle_type: inputEvent.target.value }))}
            >
              {vehicleTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Registration number</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              placeholder="Number plate"
              value={vehicleForm.registration_number}
              onChange={(inputEvent) => setVehicleForm((current) => ({ ...current, registration_number: inputEvent.target.value }))}
            />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Seats</span>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              min="1"
              type="number"
              value={vehicleForm.seats}
              onChange={(inputEvent) => setVehicleForm((current) => ({ ...current, seats: inputEvent.target.value }))}
            />
          </label>
          <Button
            className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60"
            disabled={mutations.submitting || !organizationId}
            type="submit"
          >
            Create Vehicle
          </Button>
        </form>
        {(formMessage || mutations.error || records.error) && (
          <p className="mt-3 text-xs font-bold text-slate-500">{formMessage || mutations.error || records.error}</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Vehicles Active" value="24" detail="4 free" />
        <Metric label="Drivers On Duty" value="18" detail="Covered" />
        <Metric label="Maintenance Due" value="5" detail="This week" />
        <Metric label="Permit Risk" value="2" detail="Expiry alerts" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Truck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Dispatch Command</h3>
          </div>
          {liveVehicles.length > 0 && (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              {liveVehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{vehicle.name}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{vehicle.type}</div>
                    </div>
                    <StatePill state={vehicle.status} />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-600">{vehicle.seats}</div>
                  <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-500">{vehicle.registration}</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <div key={vehicle.name} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{vehicle.name}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{vehicle.seats}</div>
                  </div>
                  <StatePill state={vehicle.status} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  {vehicle.route}
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  {vehicle.driver}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Driver Duty Board</h3>
          </div>
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div key={driver.name} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{driver.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{driver.license}</div>
                  </div>
                  <StatePill state={driver.state} />
                </div>
                <div className="mt-3 text-sm font-bold text-slate-700">{driver.duty}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Maintenance & Fuel</h3>
          </div>
          <div className="space-y-3">
            {maintenance.map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{item.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.meta}</div>
                  </div>
                  <StatePill state={item.state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileBadge className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Permit Compliance</h3>
          </div>
          <div className="space-y-3">
            {permits.map((permit) => (
              <div key={permit.title} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div>
                  <div className="text-sm font-black text-slate-950">{permit.title}</div>
                  <div className="mt-1 text-xs text-slate-500">{permit.detail}</div>
                </div>
                <StatePill state={permit.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Trip Manifest</h3>
          </div>
          <div className="space-y-3">
            {manifests.map((manifest) => (
              <div key={manifest.title} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{manifest.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{manifest.detail}</div>
                  </div>
                  <StatePill state={manifest.state} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          {readinessSignals.map(({ title, detail, icon: Icon }) => (
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
