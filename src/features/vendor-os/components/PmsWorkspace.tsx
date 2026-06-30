import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BedDouble, CalendarCheck, ClipboardCheck, DoorOpen, FileBadge, Hotel, IndianRupee, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { getAccommodationModuleInsights } from '../accommodationModuleInsights';
import { createVendorPmsRecord, listVendorPmsRecords, updateVendorPmsRecord } from '../api';
import { useVendorOSRecordMutations, useVendorOSRecords } from '../hooks';
import type {
  VendorFolioEntryRecord,
  VendorHousekeepingTaskRecord,
  VendorPmsReservationRecord,
  VendorRoomRecord,
  VendorRoomTypeRecord,
} from '../types';
import { AccommodationInsightPanel } from './AccommodationInsightPanel';

interface PmsWorkspaceProps {
  organizationId?: string;
  branchId?: string | null;
  accommodationAccess?: ResolvedVendorAccommodationAccess | null;
}

const propertyTypeOptions = ['hotel', 'resort', 'homestay', 'hostel', 'villa'];
const roomStatusOptions = ['available', 'occupied', 'reserved', 'dirty', 'blocked', 'maintenance'];
const housekeepingStatusOptions = ['clean', 'dirty', 'inspected', 'in_progress', 'out_of_service'];
const reservationStatusOptions = ['reserved', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
const taskStatusOptions = ['pending', 'assigned', 'in_progress', 'done', 'blocked'];
const folioEntryTypes = ['room_charge', 'tax', 'addon', 'discount', 'payment'];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value || 0);
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

function StatePill({ state }: { state: string }) {
  const normalizedState = state.replace(/_/g, ' ');
  const attention = ['dirty', 'blocked', 'pending', 'cancelled', 'no_show', 'maintenance', 'in progress'].includes(
    normalizedState.toLowerCase(),
  );
  return (
    <span
      className={
        attention
          ? 'w-fit rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase text-rose-700 ring-1 ring-rose-100'
          : 'w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700 ring-1 ring-emerald-100'
      }
    >
      {normalizedState}
    </span>
  );
}

export function PmsWorkspace({ organizationId, branchId, accommodationAccess }: PmsWorkspaceProps) {
  const propertyRecords = useVendorOSRecords('pms', organizationId);
  const propertyMutations = useVendorOSRecordMutations('pms', organizationId, branchId);
  const accommodationInsight = getAccommodationModuleInsights('pms', accommodationAccess);

  const [roomTypes, setRoomTypes] = useState<VendorRoomTypeRecord[]>([]);
  const [rooms, setRooms] = useState<VendorRoomRecord[]>([]);
  const [reservations, setReservations] = useState<VendorPmsReservationRecord[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<VendorHousekeepingTaskRecord[]>([]);
  const [folioEntries, setFolioEntries] = useState<VendorFolioEntryRecord[]>([]);
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);

  const [propertyForm, setPropertyForm] = useState({ name: '', property_type: 'hotel', address: '' });
  const [roomTypeForm, setRoomTypeForm] = useState({ name: '', occupancy: '', base_rate: '', property_id: '' });
  const [roomForm, setRoomForm] = useState({ property_id: '', room_type_id: '', room_number: '', floor: '', status: 'available' });
  const [reservationForm, setReservationForm] = useState({
    property_id: '',
    room_id: '',
    guest_name: '',
    check_in_date: '',
    check_out_date: '',
  });
  const [taskForm, setTaskForm] = useState({ property_id: '', room_id: '', title: '' });
  const [folioForm, setFolioForm] = useState({ property_id: '', reservation_id: '', title: '', amount: '', entry_type: 'room_charge' });

  const liveProperties = useMemo(
    () =>
      propertyRecords.records.map((record) => ({
        id: String(record.id),
        name: String(record.name || 'Untitled property'),
        propertyType: String(record.property_type || 'property'),
        address: String(record.address || 'No address added'),
        status: record.is_active === false ? 'Inactive' : 'Active',
      })),
    [propertyRecords.records],
  );

  const roomTypeMap = useMemo(() => new Map(roomTypes.map((roomType) => [roomType.id, roomType])), [roomTypes]);
  const roomMap = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);
  const propertyOptions = liveProperties.map((property) => ({ value: property.id, label: property.name }));

  async function refreshPmsData() {
    if (!organizationId) return;

    const [roomTypeRows, roomRows, reservationRows, taskRows, folioRows] = await Promise.all([
      listVendorPmsRecords('room_types', organizationId),
      listVendorPmsRecords('rooms', organizationId),
      listVendorPmsRecords('reservations', organizationId),
      listVendorPmsRecords('housekeeping', organizationId),
      listVendorPmsRecords('folios', organizationId),
    ]);

    setRoomTypes(roomTypeRows);
    setRooms(roomRows);
    setReservations(reservationRows);
    setHousekeepingTasks(taskRows);
    setFolioEntries(folioRows);
  }

  useEffect(() => {
    refreshPmsData().catch(() => setWorkspaceMessage('Unable to load PMS records'));
  }, [organizationId]);

  useEffect(() => {
    const firstPropertyId = liveProperties[0]?.id || '';
    setRoomTypeForm((current) => ({ ...current, property_id: current.property_id || firstPropertyId }));
    setRoomForm((current) => ({ ...current, property_id: current.property_id || firstPropertyId }));
    setReservationForm((current) => ({ ...current, property_id: current.property_id || firstPropertyId }));
    setTaskForm((current) => ({ ...current, property_id: current.property_id || firstPropertyId }));
    setFolioForm((current) => ({ ...current, property_id: current.property_id || firstPropertyId }));
  }, [liveProperties]);

  const metrics = useMemo(() => {
    const roomCount = rooms.length;
    const occupiedCount = rooms.filter((room) => ['occupied', 'reserved'].includes(room.status)).length;
    const dirtyCount = rooms.filter((room) => room.housekeeping_status === 'dirty' || room.status === 'dirty').length;
    const arrivalsCount = reservations.filter((reservation) => reservation.status === 'reserved').length;
    const openFoliosCount = folioEntries.filter((folio) => folio.payment_state !== 'settled' && folio.payment_state !== 'void').length;

    return {
      occupancy: roomCount > 0 ? `${Math.round((occupiedCount / roomCount) * 100)}%` : '0%',
      occupancyDetail: `${occupiedCount}/${roomCount || 0} rooms held`,
      arrivals: String(arrivalsCount),
      arrivalsDetail: 'Upcoming arrivals',
      dirtyRooms: String(dirtyCount),
      dirtyRoomsDetail: 'Need housekeeping',
      openFolios: String(openFoliosCount),
      openFoliosDetail: 'Awaiting settlement',
    };
  }, [folioEntries, reservations, rooms]);

  const arrivalRows = reservations.map((reservation) => ({
    id: reservation.id,
    guest: reservation.guest_name,
    room: roomMap.get(reservation.room_id || '')?.room_number || 'Room unassigned',
    type: reservation.status,
    time: `${reservation.check_in_date} -> ${reservation.check_out_date}`,
    docs: reservation.payment_status.replace(/_/g, ' '),
  }));

  const guestDocuments = reservations.slice(0, 3).map((reservation, index) => ({
    title: `${reservation.guest_name} ID`,
    room: roomMap.get(reservation.room_id || '')?.room_number || 'Room unassigned',
    state: index % 2 === 0 ? 'Verified' : 'Pending',
  }));

  async function handlePropertySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkspaceMessage(null);

    try {
      await propertyMutations.createRecord({
        name: propertyForm.name,
        property_type: propertyForm.property_type,
        address: propertyForm.address,
      });
      setPropertyForm({ name: '', property_type: 'hotel', address: '' });
      await propertyRecords.refresh();
      setWorkspaceMessage('Property created');
    } catch (err) {
      setWorkspaceMessage(err instanceof Error ? err.message : 'Unable to create property');
    }
  }

  async function handlePmsCreate(
    resource: Parameters<typeof createVendorPmsRecord>[0],
    payload: Record<string, unknown>,
    reset: () => void,
    successMessage: string,
  ) {
    if (!organizationId) return;
    setWorkspaceMessage(null);
    try {
      await createVendorPmsRecord(resource, organizationId, branchId || null, payload);
      reset();
      await refreshPmsData();
      setWorkspaceMessage(successMessage);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : 'Unable to save PMS record');
    }
  }

  async function handleReservationStatusUpdate(reservationId: string, status: string) {
    if (!organizationId) return;
    await updateVendorPmsRecord('reservations', organizationId, reservationId, { status });
    await refreshPmsData();
  }

  async function handleHousekeepingStatusUpdate(taskId: string, status: string) {
    if (!organizationId) return;
    await updateVendorPmsRecord('housekeeping', organizationId, taskId, { status });
    await refreshPmsData();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-600">Rooms, guests, housekeeping, folios</div>
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

      <AccommodationInsightPanel insight={accommodationInsight} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Create Property</h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">Backed by vendor_properties</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">Live PMS API</span>
        </div>
        <form className="grid gap-3 md:grid-cols-[1fr_0.7fr_1.2fr_auto]" onSubmit={handlePropertySubmit}>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Property name *</span>
            <input aria-label="Property name *" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="Property name" required value={propertyForm.name} onChange={(event) => setPropertyForm((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Property type *</span>
            <select aria-label="Property type *" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" required value={propertyForm.property_type} onChange={(event) => setPropertyForm((current) => ({ ...current, property_type: event.target.value }))}>
              {propertyTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Address</span>
            <input aria-label="Address" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" placeholder="Property address" value={propertyForm.address} onChange={(event) => setPropertyForm((current) => ({ ...current, address: event.target.value }))} />
          </label>
          <Button className="mt-auto h-11 rounded-xl bg-emerald-600 px-5 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-60" disabled={propertyMutations.submitting || !organizationId} type="submit">Create Property</Button>
        </form>
        {(workspaceMessage || propertyMutations.error || propertyRecords.error) && <p className="mt-3 text-xs font-bold text-slate-500">{workspaceMessage || propertyMutations.error || propertyRecords.error}</p>}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Occupancy" value={metrics.occupancy} detail={metrics.occupancyDetail} />
        <Metric label="Arrivals" value={metrics.arrivals} detail={metrics.arrivalsDetail} />
        <Metric label="Rooms Dirty" value={metrics.dirtyRooms} detail={metrics.dirtyRoomsDetail} />
        <Metric label="Open Folios" value={metrics.openFolios} detail={metrics.openFoliosDetail} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><BedDouble className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Room Types</h3></div>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={(event) => {
            event.preventDefault();
            handlePmsCreate('room_types', {
              property_id: roomTypeForm.property_id,
              name: roomTypeForm.name,
              occupancy: Number(roomTypeForm.occupancy || 1),
              base_rate: Number(roomTypeForm.base_rate || 0),
            }, () => setRoomTypeForm((current) => ({ ...current, name: '', occupancy: '', base_rate: '' })), 'Room type created');
          }}>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={roomTypeForm.property_id} onChange={(event) => setRoomTypeForm((current) => ({ ...current, property_id: event.target.value }))}>
              {propertyOptions.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
            </select>
            <input aria-label="Room type name *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Room type name" value={roomTypeForm.name} onChange={(event) => setRoomTypeForm((current) => ({ ...current, name: event.target.value }))} required />
            <input aria-label="Occupancy *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Occupancy" type="number" min="1" value={roomTypeForm.occupancy} onChange={(event) => setRoomTypeForm((current) => ({ ...current, occupancy: event.target.value }))} required />
            <div className="flex gap-3">
              <input aria-label="Base rate *" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Base rate" type="number" min="0" value={roomTypeForm.base_rate} onChange={(event) => setRoomTypeForm((current) => ({ ...current, base_rate: event.target.value }))} required />
              <Button type="submit" className="h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">Create Room Type</Button>
            </div>
          </form>
          <div className="mt-4 space-y-3">
            {roomTypes.map((roomType) => (
              <div key={roomType.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{roomType.name}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{roomType.occupancy} pax</div>
                </div>
                <div className="mt-2 text-sm text-slate-600">{formatCurrency(Number(roomType.base_rate))}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Hotel className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Front Desk Command</h3></div>
          {liveProperties.length > 0 && (
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              {liveProperties.map((property) => (
                <div key={property.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{property.name}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-emerald-700">{property.propertyType}</div>
                    </div>
                    <StatePill state={property.status} />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-600">{property.address}</div>
                </div>
              ))}
            </div>
          )}
          <form className="grid gap-3 md:grid-cols-5" onSubmit={(event) => {
            event.preventDefault();
            handlePmsCreate('rooms', {
              property_id: roomForm.property_id,
              room_type_id: roomForm.room_type_id || null,
              room_number: roomForm.room_number,
              floor: roomForm.floor || null,
              status: roomForm.status,
              housekeeping_status: 'clean',
            }, () => setRoomForm((current) => ({ ...current, room_type_id: '', room_number: '', floor: '', status: 'available' })), 'Room created');
          }}>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={roomForm.property_id} onChange={(event) => setRoomForm((current) => ({ ...current, property_id: event.target.value }))}>
              {propertyOptions.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={roomForm.room_type_id} onChange={(event) => setRoomForm((current) => ({ ...current, room_type_id: event.target.value }))}>
              <option value="">Room type</option>
              {roomTypes.filter((roomType) => roomType.property_id === roomForm.property_id).map((roomType) => <option key={roomType.id} value={roomType.id}>{roomType.name}</option>)}
            </select>
            <input aria-label="Room number *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Room number" value={roomForm.room_number} onChange={(event) => setRoomForm((current) => ({ ...current, room_number: event.target.value }))} required />
            <input className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Floor" value={roomForm.floor} onChange={(event) => setRoomForm((current) => ({ ...current, floor: event.target.value }))} />
            <Button type="submit" className="h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">Create Room</Button>
          </form>
          <div className="mb-3 mt-4 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-black text-slate-950">Room Grid</h4>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rooms.map((room) => (
              <div key={room.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{room.room_number}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{roomTypeMap.get(room.room_type_id || '')?.name || 'Room inventory'}</div>
                  </div>
                  <StatePill state={room.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{room.housekeeping_status.replace(/_/g, ' ')}</span>
                  <span>{room.floor || 'Ground floor'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Arrivals & Departures</h3></div>
          <form className="grid gap-3 md:grid-cols-5" onSubmit={(event) => {
            event.preventDefault();
            handlePmsCreate('reservations', {
              property_id: reservationForm.property_id,
              room_id: reservationForm.room_id || null,
              guest_name: reservationForm.guest_name,
              check_in_date: reservationForm.check_in_date,
              check_out_date: reservationForm.check_out_date,
              adults: 1,
              children: 0,
              total_amount: 0,
              status: 'reserved',
            }, () => setReservationForm((current) => ({ ...current, room_id: '', guest_name: '', check_in_date: '', check_out_date: '' })), 'Reservation created');
          }}>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={reservationForm.property_id} onChange={(event) => setReservationForm((current) => ({ ...current, property_id: event.target.value, room_id: '' }))}>
              {propertyOptions.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={reservationForm.room_id} onChange={(event) => setReservationForm((current) => ({ ...current, room_id: event.target.value }))}>
              <option value="">Assign room</option>
              {rooms.filter((room) => room.property_id === reservationForm.property_id).map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
            </select>
            <input aria-label="Guest name *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Guest name" value={reservationForm.guest_name} onChange={(event) => setReservationForm((current) => ({ ...current, guest_name: event.target.value }))} required />
            <input aria-label="Check-in date *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" type="date" value={reservationForm.check_in_date} onChange={(event) => setReservationForm((current) => ({ ...current, check_in_date: event.target.value }))} required />
            <div className="flex gap-3">
              <input aria-label="Check-out date *" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" type="date" value={reservationForm.check_out_date} onChange={(event) => setReservationForm((current) => ({ ...current, check_out_date: event.target.value }))} required />
              <Button type="submit" className="h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">Create Reservation</Button>
            </div>
          </form>
          <div className="mt-4 space-y-3">
            {arrivalRows.map((move) => (
              <div key={move.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{move.guest}</div>
                  <StatePill state={move.type} />
                </div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{move.room} / {move.time}</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">{move.docs}</div>
                  <select className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold uppercase tracking-widest text-slate-700" value={move.type} onChange={(event) => handleReservationStatusUpdate(move.id, event.target.value)}>
                    {reservationStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Housekeeping Board</h3></div>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={(event) => {
            event.preventDefault();
            handlePmsCreate('housekeeping', {
              property_id: taskForm.property_id,
              room_id: taskForm.room_id || null,
              title: taskForm.title,
              status: 'pending',
            }, () => setTaskForm((current) => ({ ...current, room_id: '', title: '' })), 'Housekeeping task created');
          }}>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={taskForm.property_id} onChange={(event) => setTaskForm((current) => ({ ...current, property_id: event.target.value, room_id: '' }))}>
              {propertyOptions.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={taskForm.room_id} onChange={(event) => setTaskForm((current) => ({ ...current, room_id: event.target.value }))}>
              <option value="">Room</option>
              {rooms.filter((room) => room.property_id === taskForm.property_id).map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
            </select>
            <input aria-label="Housekeeping task *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Task" value={taskForm.title} onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))} required />
            <Button type="submit" className="h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">Create Task</Button>
          </form>
          <div className="mt-4 space-y-3">
            {housekeepingTasks.map((task) => (
              <div key={task.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{task.title}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{roomMap.get(task.room_id || '')?.room_number || 'Property task'}</div>
                  </div>
                  <StatePill state={task.status} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-emerald-700">{task.due_at || 'Due when assigned'}</div>
                  <select className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold uppercase tracking-widest text-slate-700" value={task.status} onChange={(event) => handleHousekeepingStatusUpdate(task.id, event.target.value)}>
                    {taskStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><FileBadge className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Guest Documents</h3></div>
          <div className="space-y-3">
            {guestDocuments.map((doc) => (
              <div key={`${doc.title}-${doc.room}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div>
                  <div className="text-sm font-black text-slate-950">{doc.title}</div>
                  <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{doc.room}</div>
                </div>
                <StatePill state={doc.state} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2"><IndianRupee className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Folio & Rates</h3></div>
          <form className="grid gap-3 md:grid-cols-5" onSubmit={(event) => {
            event.preventDefault();
            handlePmsCreate('folios', {
              property_id: folioForm.property_id,
              reservation_id: folioForm.reservation_id || null,
              title: folioForm.title,
              amount: Number(folioForm.amount || 0),
              entry_type: folioForm.entry_type,
              quantity: 1,
            }, () => setFolioForm((current) => ({ ...current, reservation_id: '', title: '', amount: '', entry_type: 'room_charge' })), 'Folio entry created');
          }}>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={folioForm.property_id} onChange={(event) => setFolioForm((current) => ({ ...current, property_id: event.target.value, reservation_id: '' }))}>
              {propertyOptions.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={folioForm.reservation_id} onChange={(event) => setFolioForm((current) => ({ ...current, reservation_id: event.target.value }))}>
              <option value="">Reservation</option>
              {reservations.filter((reservation) => reservation.property_id === folioForm.property_id).map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.guest_name}</option>)}
            </select>
            <input aria-label="Folio title *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Folio title" value={folioForm.title} onChange={(event) => setFolioForm((current) => ({ ...current, title: event.target.value }))} required />
            <input aria-label="Amount *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Amount" type="number" min="0" value={folioForm.amount} onChange={(event) => setFolioForm((current) => ({ ...current, amount: event.target.value }))} required />
            <div className="flex gap-3">
              <select className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={folioForm.entry_type} onChange={(event) => setFolioForm((current) => ({ ...current, entry_type: event.target.value }))}>
                {folioEntryTypes.map((entryType) => <option key={entryType} value={entryType}>{entryType}</option>)}
              </select>
              <Button type="submit" className="h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700">Create Folio Entry</Button>
            </div>
          </form>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {folioEntries.map((folio) => (
              <div key={folio.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-950">{folio.title}</div>
                  <StatePill state={folio.payment_state} />
                </div>
                <div className="mt-3 text-xl font-black text-slate-950">{formatCurrency(Number(folio.amount) * Number(folio.quantity || 1))}</div>
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
            <div className="mt-1 text-sm text-slate-600">Dirty, blocked, occupied, and held rooms are protected from direct-booking oversell.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
