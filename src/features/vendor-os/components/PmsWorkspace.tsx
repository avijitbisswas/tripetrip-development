import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BedDouble, CalendarCheck, ClipboardCheck, DoorOpen, FileBadge, Hotel, IndianRupee, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendTransactionalEmail } from '@/src/services/email';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { getAccommodationModuleInsights } from '../accommodationModuleInsights';
import { createVendorPmsRecord, listVendorPmsRecords, listVendorTeamMembers, updateVendorPmsRecord } from '../api';
import { useVendorOSDocuments, useVendorOSRecordMutations, useVendorOSRecords, useVendorDocumentUpload } from '../hooks';
import type {
  VendorDocument,
  VendorFolioEntryRecord,
  VendorHousekeepingTaskRecord,
  VendorPmsReservationRecord,
  VendorRoomRecord,
  VendorRoomTypeRecord,
  VendorTeamMember,
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
const paymentStatusOptions = ['pending', 'partial', 'paid', 'refunded'];
const reservationSourceOptions = ['manual', 'direct', 'ota', 'group'];
type GuestAutomationAction = 'confirmation' | 'reminder';

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

function formatDateLabel(value: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function datesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const leftStart = new Date(startA).getTime();
  const leftEnd = new Date(endA).getTime();
  const rightStart = new Date(startB).getTime();
  const rightEnd = new Date(endB).getTime();

  if ([leftStart, leftEnd, rightStart, rightEnd].some((value) => Number.isNaN(value))) {
    return false;
  }

  return leftStart < rightEnd && rightStart < leftEnd;
}

function formatDateTimeLabel(value: string | null) {
  if (!value) return 'Due when assigned';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function buildDueAtValue(baseDate: string | null, timeValue: string) {
  if (!timeValue) return null;
  const datePart = baseDate || new Date().toISOString().slice(0, 10);
  return new Date(`${datePart}T${timeValue}:00`).toISOString();
}

export function buildGuestAutomationEmail(
  reservation: {
    guest: string;
    room: string;
    time: string;
    docs: string;
    amount: number;
    notes: string;
    source: string;
    propertyId: string;
  },
  properties: Array<{ id: string; name: string }>,
  action: GuestAutomationAction,
) {
  const propertyName = properties.find((property) => property.id === reservation.propertyId)?.name || 'your property';
  const subject =
    action === 'confirmation'
      ? `Booking confirmed at ${propertyName}`
      : `Pre-arrival reminder for ${propertyName}`;
  const headline =
    action === 'confirmation'
      ? `Your stay at ${propertyName} is confirmed`
      : `Your stay at ${propertyName} is coming up soon`;
  const supportingCopy =
    action === 'confirmation'
      ? 'We have secured your reservation and shared the key stay details below.'
      : 'Here is a quick reminder with your arrival details before check-in.';

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="margin:0 0 12px">${headline}</h2>
      <p style="margin:0 0 16px">Hi ${reservation.guest},</p>
      <p style="margin:0 0 16px">${supportingCopy}</p>
      <div style="border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Property:</strong> ${propertyName}</p>
        <p style="margin:0 0 8px"><strong>Room:</strong> ${reservation.room}</p>
        <p style="margin:0 0 8px"><strong>Stay:</strong> ${reservation.time}</p>
        <p style="margin:0 0 8px"><strong>Payment:</strong> ${reservation.docs}</p>
        <p style="margin:0"><strong>Amount:</strong> ${formatCurrency(reservation.amount)}</p>
      </div>
      ${reservation.notes ? `<p style="margin:16px 0 0"><strong>Notes:</strong> ${reservation.notes}</p>` : ''}
      <p style="margin:16px 0 0">Reservation source: ${reservation.source}</p>
    </div>
  `;

  return { subject, html };
}

export function PmsWorkspace({ organizationId, branchId, accommodationAccess }: PmsWorkspaceProps) {
  const propertyRecords = useVendorOSRecords('pms', organizationId);
  const propertyMutations = useVendorOSRecordMutations('pms', organizationId, branchId);
  const documentMutations = useVendorOSRecordMutations('documents', organizationId, branchId, accommodationAccess);
  const documentUploads = useVendorDocumentUpload(organizationId, branchId, accommodationAccess);
  const accommodationInsight = getAccommodationModuleInsights('pms', accommodationAccess);
  const uploadedDocuments = useVendorOSDocuments(organizationId);

  const [roomTypes, setRoomTypes] = useState<VendorRoomTypeRecord[]>([]);
  const [rooms, setRooms] = useState<VendorRoomRecord[]>([]);
  const [reservations, setReservations] = useState<VendorPmsReservationRecord[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<VendorHousekeepingTaskRecord[]>([]);
  const [folioEntries, setFolioEntries] = useState<VendorFolioEntryRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<VendorTeamMember[]>([]);
  const [guestDocuments, setGuestDocuments] = useState<VendorDocument[]>([]);
  const [guestUploadFiles, setGuestUploadFiles] = useState<Record<string, File | null>>({});
  const [guestAutomationSending, setGuestAutomationSending] = useState<Record<string, GuestAutomationAction | null>>({});
  const [housekeepingDispatchEdits, setHousekeepingDispatchEdits] = useState<
    Record<string, { assigned_to: string; due_time: string }>
  >({});
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);

  const [propertyForm, setPropertyForm] = useState({ name: '', property_type: 'hotel', address: '' });
  const [roomTypeForm, setRoomTypeForm] = useState({ name: '', occupancy: '', base_rate: '', property_id: '' });
  const [roomForm, setRoomForm] = useState({ property_id: '', room_type_id: '', room_number: '', floor: '', status: 'available' });
  const [reservationForm, setReservationForm] = useState({
    property_id: '',
    room_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in_date: '',
    check_out_date: '',
    adults: '1',
    children: '0',
    total_amount: '',
    source: 'manual',
    payment_status: 'pending',
    notes: '',
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

    const [roomTypeRows, roomRows, reservationRows, taskRows, folioRows, teamMemberRows] = await Promise.all([
      listVendorPmsRecords('room_types', organizationId),
      listVendorPmsRecords('rooms', organizationId),
      listVendorPmsRecords('reservations', organizationId),
      listVendorPmsRecords('housekeeping', organizationId),
      listVendorPmsRecords('folios', organizationId),
      listVendorTeamMembers(organizationId),
    ]);

    setRoomTypes(roomTypeRows);
    setRooms(roomRows);
    setReservations(reservationRows);
    setHousekeepingTasks(taskRows);
    setFolioEntries(folioRows);
    setTeamMembers(teamMemberRows);
  }

  useEffect(() => {
    refreshPmsData().catch(() => setWorkspaceMessage('Unable to load PMS records'));
  }, [organizationId]);

  useEffect(() => {
    setGuestDocuments(uploadedDocuments);
  }, [uploadedDocuments]);

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
    guestEmail: reservation.guest_email || 'Email pending',
    guestPhone: reservation.guest_phone || 'Phone pending',
    room: roomMap.get(reservation.room_id || '')?.room_number || 'Room unassigned',
    type: reservation.status,
    checkInDate: reservation.check_in_date,
    checkOutDate: reservation.check_out_date,
    time: `${formatDateLabel(reservation.check_in_date)} -> ${formatDateLabel(reservation.check_out_date)}`,
    docs: reservation.payment_status.replace(/_/g, ' '),
    amount: Number(reservation.total_amount || 0),
    notes: reservation.notes || '',
    roomId: reservation.room_id || '',
    propertyId: reservation.property_id,
    source: reservation.source || 'manual',
  }));

  const activeReservations = useMemo(
    () => reservations.filter((reservation) => !['cancelled', 'no_show', 'checked_out'].includes(reservation.status)),
    [reservations],
  );

  const roomAvailabilityRows = useMemo(
    () =>
      rooms.map((room) => {
        const roomReservations = activeReservations.filter((reservation) => reservation.room_id === room.id);
        const leadReservation = roomReservations[0] || null;
        const roomType = roomTypeMap.get(room.room_type_id || '');
        const conflictCount = Math.max(roomReservations.length - 1, 0);

        return {
          id: room.id,
          roomNumber: room.room_number,
          roomTypeName: roomType?.name || 'Room inventory',
          occupancyLimit: Number(roomType?.occupancy || 0),
          currentStatus: room.status,
          housekeepingStatus: room.housekeeping_status || 'clean',
          leadGuest: leadReservation?.guest_name || 'Open inventory',
          stayWindow: leadReservation
            ? `${formatDateLabel(leadReservation.check_in_date)} -> ${formatDateLabel(leadReservation.check_out_date)}`
            : 'No active stay',
          conflictCount,
          riskState:
            conflictCount > 0
              ? 'Conflict risk'
              : ['blocked', 'maintenance'].includes(room.status)
                ? 'Blocked'
                : room.status === 'dirty'
                  ? 'Prep needed'
                  : roomReservations.length > 0
                    ? 'Held'
                    : 'Open',
        };
      }),
    [activeReservations, roomTypeMap, rooms],
  );

  const bookingControlSummary = useMemo(() => {
    const unassignedArrivals = activeReservations.filter((reservation) => reservation.status === 'reserved' && !reservation.room_id).length;
    const conflictRooms = roomAvailabilityRows.filter((room) => room.conflictCount > 0).length;
    const blockedRooms = roomAvailabilityRows.filter((room) => ['blocked', 'maintenance'].includes(room.currentStatus)).length;
    const sourceMix = reservationSourceOptions.map((source) => ({
      source,
      count: reservations.filter((reservation) => String(reservation.source || 'manual') === source).length,
    }));

    return {
      unassignedArrivals,
      conflictRooms,
      blockedRooms,
      sourceMix,
    };
  }, [activeReservations, reservations, roomAvailabilityRows]);
  const reservationAssignmentRows = useMemo(
    () =>
      activeReservations
        .filter((reservation) => reservation.status === 'reserved' && !reservation.room_id)
        .map((reservation) => {
          const totalGuests = Number(reservation.adults || 0) + Number(reservation.children || 0);
          const suggestedRoom =
            rooms
              .filter(
                (room) =>
                  room.property_id === reservation.property_id &&
                  room.status === 'available' &&
                  room.housekeeping_status === 'clean',
              )
              .find((room) => {
                const roomType = roomTypeMap.get(room.room_type_id || '');
                const occupancyLimit = Number(roomType?.occupancy || 0);
                if (occupancyLimit > 0 && totalGuests > occupancyLimit) {
                  return false;
                }

                return !activeReservations.some(
                  (activeReservation) =>
                    activeReservation.id !== reservation.id &&
                    activeReservation.room_id === room.id &&
                    datesOverlap(
                      activeReservation.check_in_date,
                      activeReservation.check_out_date,
                      reservation.check_in_date,
                      reservation.check_out_date,
                    ),
                );
              }) || null;

          return {
            id: reservation.id,
            reservation,
            guestName: reservation.guest_name,
            stayWindow: `${formatDateLabel(reservation.check_in_date)} -> ${formatDateLabel(reservation.check_out_date)}`,
            suggestedRoom,
          };
        }),
    [activeReservations, roomTypeMap, rooms],
  );
  const reservationAssignmentSummary = useMemo(() => {
    const assignableCount = reservationAssignmentRows.filter((row) => row.suggestedRoom).length;
    return {
      assignableCount,
      unassignableCount: reservationAssignmentRows.length - assignableCount,
    };
  }, [reservationAssignmentRows]);
  const teamMemberMap = useMemo(() => new Map(teamMembers.map((member) => [member.id, member])), [teamMembers]);
  const housekeepingDispatchRows = useMemo(
    () =>
      housekeepingTasks.map((task) => {
        const room = task.room_id ? roomMap.get(task.room_id) : null;
        const roomReservations = task.room_id
          ? reservations.filter(
              (reservation) =>
                reservation.room_id === task.room_id && !['cancelled', 'checked_out', 'no_show'].includes(reservation.status),
            )
          : [];
        const nextArrival = roomReservations
          .filter((reservation) => reservation.status === 'reserved')
          .sort((left, right) => new Date(left.check_in_date).getTime() - new Date(right.check_in_date).getTime())[0];
        const isDirtyRoom = room?.status === 'dirty' || room?.housekeeping_status === 'dirty';
        const priority =
          nextArrival && isDirtyRoom
            ? 'Arrival first'
            : task.status === 'blocked'
              ? 'Blocked'
              : task.status === 'pending'
                ? 'Ready to assign'
                : 'Routine';
        const assignedMember = task.assigned_to ? teamMemberMap.get(task.assigned_to) : null;

        return {
          id: task.id,
          title: task.title,
          task,
          roomNumber: room?.room_number || 'Property task',
          priority,
          nextArrivalGuest: nextArrival?.guest_name || null,
          nextArrivalDate: nextArrival?.check_in_date || null,
          assignedLabel: assignedMember?.display_name || assignedMember?.invited_email || 'Unassigned',
          dueLabel: formatDateTimeLabel(task.due_at),
        };
      }),
    [housekeepingTasks, reservations, roomMap, teamMemberMap],
  );
  const housekeepingDispatchSummary = useMemo(() => {
    const urgentCount = housekeepingDispatchRows.filter((row) => row.priority === 'Arrival first').length;
    const unassignedCount = housekeepingDispatchRows.filter((row) => !row.task.assigned_to).length;
    const blockedCount = housekeepingDispatchRows.filter((row) => row.task.status === 'blocked').length;

    return {
      urgentCount,
      unassignedCount,
      blockedCount,
    };
  }, [housekeepingDispatchRows]);

  const guestArrivalReadiness = useMemo(
    () =>
      reservations.map((reservation) => {
        const linkedDocuments = guestDocuments.filter(
          (document) => document.entity_type === 'vendor_pms_reservation' && document.entity_id === reservation.id,
        );
        const latestDocument = linkedDocuments
          .slice()
          .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0];
        const latestVerificationStatus = String(
          (latestDocument?.metadata?.verification_status as string | undefined) || (latestDocument ? 'submitted' : 'missing'),
        );
        const contactReady = Boolean(reservation.guest_email && reservation.guest_phone);
        const identityReady = latestVerificationStatus === 'verified';
        const readinessState = identityReady && contactReady ? 'Ready' : latestVerificationStatus === 'submitted' ? 'Submitted' : 'Pending';

        return {
          reservationId: reservation.id,
          guestName: reservation.guest_name,
          room: roomMap.get(reservation.room_id || '')?.room_number || 'Room unassigned',
          stay: `${formatDateLabel(reservation.check_in_date)} -> ${formatDateLabel(reservation.check_out_date)}`,
          readinessState,
          contactReady,
          identityReady,
          latestDocument,
          documentLabel: latestDocument?.name || 'No ID uploaded',
        };
      }),
    [guestDocuments, reservations, roomMap],
  );

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

  async function handleReservationLifecycleAction(reservation: {
    id: string;
    roomId: string;
    propertyId: string;
    guest: string;
  }, action: 'check_in' | 'check_out') {
    if (!organizationId || !reservation.roomId) {
      setWorkspaceMessage('Assign a room before updating this reservation.');
      return;
    }

    setWorkspaceMessage(null);

    try {
      if (action === 'check_in') {
        await updateVendorPmsRecord('reservations', organizationId, reservation.id, { status: 'checked_in' });
        await updateVendorPmsRecord('rooms', organizationId, reservation.roomId, {
          status: 'occupied',
          housekeeping_status: 'in_progress',
        });
        setWorkspaceMessage(`Checked in ${reservation.guest}`);
      } else {
        await updateVendorPmsRecord('reservations', organizationId, reservation.id, { status: 'checked_out' });
        await updateVendorPmsRecord('rooms', organizationId, reservation.roomId, {
          status: 'dirty',
          housekeeping_status: 'dirty',
        });
        await createVendorPmsRecord('housekeeping', organizationId, branchId || null, {
          property_id: reservation.propertyId,
          room_id: reservation.roomId,
          title: `Post-checkout cleaning for ${reservation.guest}`,
          status: 'pending',
        });
        setWorkspaceMessage(`Checked out ${reservation.guest} and created a housekeeping task`);
      }

      await refreshPmsData();
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : 'Unable to update reservation lifecycle');
    }
  }

  async function handleGuestAutomation(reservation: (typeof arrivalRows)[number], action: GuestAutomationAction) {
    if (!reservation.guestEmail || reservation.guestEmail === 'Email pending') {
      setWorkspaceMessage(`Guest email required before sending ${action === 'confirmation' ? 'a confirmation' : 'a reminder'}.`);
      return;
    }

    setWorkspaceMessage(null);
    setGuestAutomationSending((current) => ({ ...current, [reservation.id]: action }));

    try {
      const email = buildGuestAutomationEmail(reservation, liveProperties, action);
      await sendTransactionalEmail({
        to: reservation.guestEmail,
        subject: email.subject,
        html: email.html,
      });
      setWorkspaceMessage(`${action === 'confirmation' ? 'Confirmation' : 'Reminder'} sent to ${reservation.guest}`);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : 'Unable to send guest email');
    } finally {
      setGuestAutomationSending((current) => ({ ...current, [reservation.id]: null }));
    }
  }

  async function handleHousekeepingStatusUpdate(taskId: string, status: string) {
    if (!organizationId) return;

    const task = housekeepingTasks.find((entry) => entry.id === taskId);
    const linkedRoom = task?.room_id ? roomMap.get(task.room_id) : null;

    await updateVendorPmsRecord('housekeeping', organizationId, taskId, { status });

    if (task?.room_id && linkedRoom) {
      if (status === 'done') {
        await updateVendorPmsRecord('rooms', organizationId, task.room_id, {
          housekeeping_status: 'clean',
          status: linkedRoom.status === 'dirty' ? 'available' : linkedRoom.status,
        });
      } else if (status === 'in_progress') {
        await updateVendorPmsRecord('rooms', organizationId, task.room_id, {
          housekeeping_status: 'in_progress',
        });
      } else if (status === 'blocked') {
        await updateVendorPmsRecord('rooms', organizationId, task.room_id, {
          housekeeping_status: 'dirty',
          status: linkedRoom.status === 'available' ? 'dirty' : linkedRoom.status,
        });
      }
    }

    await refreshPmsData();
  }

  function getDispatchEdit(task: VendorHousekeepingTaskRecord) {
    const existingDueTime = task.due_at ? new Date(task.due_at).toISOString().slice(11, 16) : '';
    return housekeepingDispatchEdits[task.id] || { assigned_to: task.assigned_to || '', due_time: existingDueTime };
  }

  async function handleHousekeepingDispatchSave(task: VendorHousekeepingTaskRecord) {
    if (!organizationId) return;

    const edit = getDispatchEdit(task);
    const matchingReservation = task.room_id
      ? reservations.find(
          (reservation) =>
            reservation.room_id === task.room_id && !['cancelled', 'checked_out', 'no_show'].includes(reservation.status),
        )
      : null;
    const dueAt = buildDueAtValue(matchingReservation?.check_in_date || null, edit.due_time);

    setWorkspaceMessage(null);

    try {
      await updateVendorPmsRecord('housekeeping', organizationId, task.id, {
        assigned_to: edit.assigned_to || null,
        due_at: dueAt,
        status: edit.assigned_to ? 'assigned' : task.status,
      });
      await refreshPmsData();
      setWorkspaceMessage(`Dispatch updated for ${task.title}`);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : 'Unable to update housekeeping dispatch');
    }
  }

  async function handleGuestDocumentUpload(reservation: VendorPmsReservationRecord) {
    const file = guestUploadFiles[reservation.id];
    if (!file) {
      setWorkspaceMessage(`Choose a file for ${reservation.guest_name} before uploading.`);
      return;
    }

    setWorkspaceMessage(null);

    try {
      const uploadedDocument = await documentUploads.uploadDocument({
        name: `${reservation.guest_name} identity document`,
        document_type: 'guest_identity',
        file,
        entityType: 'vendor_pms_reservation',
        entityId: reservation.id,
        metadata: {
          verification_status: 'submitted',
          guest_name: reservation.guest_name,
          reservation_id: reservation.id,
        },
      });

      if (uploadedDocument && typeof uploadedDocument === 'object') {
        setGuestDocuments((current) => [uploadedDocument as VendorDocument, ...current]);
      }
      setGuestUploadFiles((current) => ({ ...current, [reservation.id]: null }));
      setWorkspaceMessage(`Uploaded guest ID for ${reservation.guest_name}`);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : 'Unable to upload guest document');
    }
  }

  async function handleGuestDocumentVerify(document: VendorDocument, guestName: string) {
    if (!organizationId) return;

    setWorkspaceMessage(null);

    try {
      const nextMetadata = {
        ...(document.metadata || {}),
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
      };

      await documentMutations.updateRecord(document.id, {
        metadata: nextMetadata,
      });

      setGuestDocuments((current) =>
        current.map((entry) => (entry.id === document.id ? { ...entry, metadata: nextMetadata } : entry)),
      );
      setWorkspaceMessage(`Verified guest ID for ${guestName}`);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : 'Unable to verify guest document');
    }
  }

  async function handleAutoAssignReservation(row: (typeof reservationAssignmentRows)[number]) {
    if (!organizationId || !row.suggestedRoom) return;

    setWorkspaceMessage(null);

    try {
      await updateVendorPmsRecord('reservations', organizationId, row.id, {
        room_id: row.suggestedRoom.id,
      });
      await updateVendorPmsRecord('rooms', organizationId, row.suggestedRoom.id, {
        status: 'reserved',
        housekeeping_status: 'clean',
      });

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id === row.id ? { ...reservation, room_id: row.suggestedRoom?.id || null } : reservation,
        ),
      );
      setRooms((current) =>
        current.map((room) =>
          room.id === row.suggestedRoom?.id ? { ...room, status: 'reserved', housekeeping_status: 'clean' } : room,
        ),
      );
      setWorkspaceMessage(`Assigned room ${row.suggestedRoom.room_number} to ${row.guestName}`);
    } catch (error) {
      setWorkspaceMessage(error instanceof Error ? error.message : 'Unable to auto-assign reservation');
    }
  }

  async function handleReservationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) return;

    const totalGuests = Number(reservationForm.adults || 0) + Number(reservationForm.children || 0);
    const selectedRoom = rooms.find((room) => room.id === reservationForm.room_id);
    const selectedRoomType = selectedRoom ? roomTypeMap.get(selectedRoom.room_type_id || '') : null;

    if (selectedRoom) {
      if (['blocked', 'maintenance'].includes(selectedRoom.status)) {
        setWorkspaceMessage(`Room ${selectedRoom.room_number} is currently ${selectedRoom.status} and cannot be assigned.`);
        return;
      }

      const overlappingReservation = activeReservations.find(
        (reservation) =>
          reservation.room_id === selectedRoom.id &&
          datesOverlap(
            reservation.check_in_date,
            reservation.check_out_date,
            reservationForm.check_in_date,
            reservationForm.check_out_date,
          ),
      );

      if (overlappingReservation) {
        setWorkspaceMessage(`Room ${selectedRoom.room_number} already has an overlapping active reservation for the selected dates.`);
        return;
      }

      if (selectedRoomType && totalGuests > Number(selectedRoomType.occupancy || 0)) {
        setWorkspaceMessage(
          `Room ${selectedRoom.room_number} supports ${selectedRoomType.occupancy} guests, but this booking has ${totalGuests}.`,
        );
        return;
      }
    }

    await handlePmsCreate(
      'reservations',
      {
        property_id: reservationForm.property_id,
        room_id: reservationForm.room_id || null,
        guest_name: reservationForm.guest_name,
        guest_email: reservationForm.guest_email || null,
        guest_phone: reservationForm.guest_phone || null,
        check_in_date: reservationForm.check_in_date,
        check_out_date: reservationForm.check_out_date,
        adults: Number(reservationForm.adults || 1),
        children: Number(reservationForm.children || 0),
        total_amount: Number(reservationForm.total_amount || 0),
        status: 'reserved',
        source: reservationForm.source,
        payment_status: reservationForm.payment_status,
        notes: reservationForm.notes || null,
      },
      () =>
        setReservationForm((current) => ({
          ...current,
          room_id: '',
          guest_name: '',
          guest_email: '',
          guest_phone: '',
          check_in_date: '',
          check_out_date: '',
          adults: '1',
          children: '0',
          total_amount: '',
          source: 'manual',
          payment_status: 'pending',
          notes: '',
        })),
      'Reservation created',
    );
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

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Availability & Booking Controls</h3></div>
          <div className="grid gap-3 md:grid-cols-2">
            {roomAvailabilityRows.map((room) => (
              <div key={room.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">Room {room.roomNumber}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                      {room.roomTypeName}{room.occupancyLimit > 0 ? ` · ${room.occupancyLimit} pax` : ''}
                    </div>
                  </div>
                  <StatePill state={room.riskState} />
                </div>
                <div className="mt-3 text-sm font-semibold text-slate-700">{room.leadGuest}</div>
                <div className="mt-1 text-xs text-slate-500">{room.stayWindow}</div>
                <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
                  {room.currentStatus} · {room.housekeepingStatus.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
            {roomAvailabilityRows.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                Room availability controls will appear after inventory is created.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><Hotel className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Booking Pulse</h3></div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Unassigned arrivals</div>
              <div className="mt-3 text-2xl font-black text-slate-950">{bookingControlSummary.unassignedArrivals}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Conflict rooms</div>
              <div className="mt-3 text-2xl font-black text-slate-950">{bookingControlSummary.conflictRooms}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Blocked rooms</div>
              <div className="mt-3 text-2xl font-black text-slate-950">{bookingControlSummary.blockedRooms}</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {bookingControlSummary.sourceMix.map((source) => (
              <div key={source.source} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{source.source}</div>
                <div className="text-sm font-black text-slate-950">{source.count}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-950">Assignment Desk</h4>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {reservationAssignmentSummary.assignableCount}{' '}
                  {reservationAssignmentSummary.assignableCount === 1 ? 'assignable arrival' : 'assignable arrivals'}
                </p>
              </div>
              {reservationAssignmentSummary.unassignableCount > 0 ? (
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
                  {reservationAssignmentSummary.unassignableCount} needs manual review
                </div>
              ) : null}
            </div>
            <div className="mt-3 space-y-3">
              {reservationAssignmentRows.map((row) => (
                <div key={row.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{row.guestName}</div>
                      <div className="mt-1 text-xs text-slate-500">{row.stayWindow}</div>
                      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
                        {row.suggestedRoom ? `Suggested room ${row.suggestedRoom.room_number}` : 'No clean room available'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl text-xs font-bold uppercase tracking-widest"
                      disabled={!row.suggestedRoom}
                      onClick={() => handleAutoAssignReservation(row)}
                    >
                      Auto Assign
                    </Button>
                  </div>
                </div>
              ))}
              {reservationAssignmentRows.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-100">
                  Unassigned arrivals will appear here when a booking still needs a room.
                </div>
              ) : null}
            </div>
          </div>
        </div>
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
          <form className="grid gap-3 md:grid-cols-5" onSubmit={handleReservationSubmit}>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={reservationForm.property_id} onChange={(event) => setReservationForm((current) => ({ ...current, property_id: event.target.value, room_id: '' }))}>
              {propertyOptions.map((property) => <option key={property.value} value={property.value}>{property.label}</option>)}
            </select>
            <select className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={reservationForm.room_id} onChange={(event) => setReservationForm((current) => ({ ...current, room_id: event.target.value }))}>
              <option value="">Assign room</option>
              {rooms.filter((room) => room.property_id === reservationForm.property_id).map((room) => <option key={room.id} value={room.id}>{room.room_number}</option>)}
            </select>
            <input aria-label="Guest name *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Guest name" value={reservationForm.guest_name} onChange={(event) => setReservationForm((current) => ({ ...current, guest_name: event.target.value }))} required />
            <input aria-label="Guest email" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Guest email" type="email" value={reservationForm.guest_email} onChange={(event) => setReservationForm((current) => ({ ...current, guest_email: event.target.value }))} />
            <input aria-label="Guest phone" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Guest phone" value={reservationForm.guest_phone} onChange={(event) => setReservationForm((current) => ({ ...current, guest_phone: event.target.value }))} />
            <input aria-label="Check-in date *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" type="date" value={reservationForm.check_in_date} onChange={(event) => setReservationForm((current) => ({ ...current, check_in_date: event.target.value }))} required />
            <input aria-label="Check-out date *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" type="date" value={reservationForm.check_out_date} onChange={(event) => setReservationForm((current) => ({ ...current, check_out_date: event.target.value }))} required />
            <input aria-label="Adults *" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" min="1" type="number" value={reservationForm.adults} onChange={(event) => setReservationForm((current) => ({ ...current, adults: event.target.value }))} required />
            <input aria-label="Children" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" min="0" type="number" value={reservationForm.children} onChange={(event) => setReservationForm((current) => ({ ...current, children: event.target.value }))} />
            <input aria-label="Reservation amount" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" min="0" placeholder="Reservation amount" type="number" value={reservationForm.total_amount} onChange={(event) => setReservationForm((current) => ({ ...current, total_amount: event.target.value }))} />
            <select aria-label="Reservation source" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={reservationForm.source} onChange={(event) => setReservationForm((current) => ({ ...current, source: event.target.value }))}>
              {reservationSourceOptions.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <select aria-label="Payment status" className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" value={reservationForm.payment_status} onChange={(event) => setReservationForm((current) => ({ ...current, payment_status: event.target.value }))}>
              {paymentStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <div className="md:col-span-2">
              <input aria-label="Reservation notes" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800" placeholder="Arrival notes, preferences, or remarks" value={reservationForm.notes} onChange={(event) => setReservationForm((current) => ({ ...current, notes: event.target.value }))} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                type="submit"
                className="h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase tracking-widest hover:bg-emerald-700"
                disabled={
                  !reservationForm.property_id ||
                  !reservationForm.guest_name ||
                  !reservationForm.check_in_date ||
                  !reservationForm.check_out_date ||
                  new Date(reservationForm.check_out_date).getTime() <= new Date(reservationForm.check_in_date).getTime()
                }
              >
                Create Reservation
              </Button>
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
                <div className="mt-2 text-sm text-slate-500">{move.guestEmail} · {move.guestPhone}</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">{move.docs} · {formatCurrency(move.amount)}</div>
                  <select className="h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold uppercase tracking-widest text-slate-700" value={move.type} onChange={(event) => handleReservationStatusUpdate(move.id, event.target.value)}>
                    {reservationStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                {move.notes ? <div className="mt-2 text-xs text-slate-500">{move.notes}</div> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl bg-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800"
                    disabled={move.type === 'checked_in' || move.type === 'checked_out' || move.type === 'cancelled' || move.type === 'no_show' || !move.roomId}
                    onClick={() =>
                      void handleReservationLifecycleAction(
                        {
                          id: move.id,
                          roomId: move.roomId,
                          propertyId: move.propertyId,
                          guest: move.guest,
                        },
                        'check_in',
                      )
                    }
                  >
                    Check In
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                    disabled={move.type !== 'checked_in' || !move.roomId}
                    onClick={() =>
                      void handleReservationLifecycleAction(
                        {
                          id: move.id,
                          roomId: move.roomId,
                          propertyId: move.propertyId,
                          guest: move.guest,
                        },
                        'check_out',
                      )
                    }
                  >
                    Check Out
                  </Button>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Guest automation</div>
                      <div className="mt-1 text-sm font-semibold text-slate-600">
                        {move.guestEmail === 'Email pending' ? 'Guest email required for automation' : 'Transactional email is ready for this stay'}
                      </div>
                    </div>
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                      disabled={move.guestEmail === 'Email pending' || guestAutomationSending[move.id] !== null}
                      onClick={() => void handleGuestAutomation(move, 'confirmation')}
                    >
                      {guestAutomationSending[move.id] === 'confirmation' ? 'Sending...' : 'Send Confirmation'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                      disabled={move.guestEmail === 'Email pending' || guestAutomationSending[move.id] !== null}
                      onClick={() => void handleGuestAutomation(move, 'reminder')}
                    >
                      {guestAutomationSending[move.id] === 'reminder' ? 'Sending...' : 'Send Reminder'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Housekeeping Board</h3></div>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Dispatch Queue</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{housekeepingDispatchRows.length}</div>
              <div className="mt-1 text-xs text-slate-500">Live housekeeping tasks</div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">Urgent Room Release</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{housekeepingDispatchSummary.urgentCount}</div>
              <div className="mt-1 text-xs text-slate-500">{housekeepingDispatchSummary.urgentCount} urgent room release</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Coverage Gaps</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{housekeepingDispatchSummary.unassignedCount}</div>
              <div className="mt-1 text-xs text-slate-500">
                {housekeepingDispatchSummary.unassignedCount} unassigned / {housekeepingDispatchSummary.blockedCount} blocked
              </div>
            </div>
          </div>
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
          <div className="mt-4 space-y-3">
            {housekeepingDispatchRows.map((row) => {
              const dispatchEdit = getDispatchEdit(row.task);

              return (
                <div key={`${row.id}-dispatch`} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-slate-950">{row.title}</div>
                      <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">
                        {row.roomNumber} {row.nextArrivalDate ? `/ arrival ${formatDateLabel(row.nextArrivalDate)}` : ''}
                      </div>
                    </div>
                    <StatePill state={row.priority} />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_0.8fr_auto]">
                    <label className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Owner</span>
                      <select
                        aria-label={`Assign owner for ${row.title}`}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800"
                        value={dispatchEdit.assigned_to}
                        onChange={(event) =>
                          setHousekeepingDispatchEdits((current) => ({
                            ...current,
                            [row.id]: {
                              ...dispatchEdit,
                              assigned_to: event.target.value,
                            },
                          }))
                        }
                      >
                        <option value="">Unassigned</option>
                        {teamMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.display_name || member.invited_email || member.id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Due time</span>
                      <input
                        aria-label={`Set due time for ${row.title}`}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800"
                        type="time"
                        value={dispatchEdit.due_time}
                        onChange={(event) =>
                          setHousekeepingDispatchEdits((current) => ({
                            ...current,
                            [row.id]: {
                              ...dispatchEdit,
                              due_time: event.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        className="h-10 rounded-xl bg-slate-950 px-4 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800"
                        onClick={() => void handleHousekeepingDispatchSave(row.task)}
                      >
                        Save Dispatch
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    {row.assignedLabel} • {row.dueLabel} {row.nextArrivalGuest ? `• arrival guest ${row.nextArrivalGuest}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><FileBadge className="h-4 w-4 text-emerald-600" /><h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-800">Guest Arrival Readiness</h3></div>
          <p className="mb-4 text-xs font-semibold text-slate-400">Guest Documents</p>
          <div className="space-y-3">
            {guestArrivalReadiness.map((guest) => (
              <div key={guest.reservationId} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{guest.guestName}</div>
                    <div className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">{guest.room} / {guest.stay}</div>
                  </div>
                  <StatePill state={guest.readinessState} />
                </div>
                <div className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                  Contact {guest.contactReady ? 'ready' : 'pending'} • Identity {guest.identityReady ? 'verified' : guest.latestDocument ? 'submitted' : 'missing'}
                </div>
                <div className="mt-2 text-sm text-slate-600">{guest.documentLabel}</div>
                <div className="mt-3 space-y-2">
                  <input
                    aria-label={`Upload guest document for ${guest.guestName}`}
                    className="block w-full text-xs font-semibold text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-slate-700"
                    type="file"
                    onChange={(event) =>
                      setGuestUploadFiles((current) => ({
                        ...current,
                        [guest.reservationId]: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl bg-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800"
                      disabled={!organizationId || documentUploads.submitting}
                      onClick={() => {
                        const reservation = reservations.find((entry) => entry.id === guest.reservationId);
                        if (reservation) void handleGuestDocumentUpload(reservation);
                      }}
                    >
                      Upload ID
                    </Button>
                    {guest.latestDocument ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-[10px] font-bold uppercase tracking-widest"
                        disabled={!organizationId || guest.identityReady || documentMutations.submitting}
                        onClick={() => void handleGuestDocumentVerify(guest.latestDocument, guest.guestName)}
                      >
                        Mark Verified
                      </Button>
                    ) : null}
                  </div>
                </div>
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
