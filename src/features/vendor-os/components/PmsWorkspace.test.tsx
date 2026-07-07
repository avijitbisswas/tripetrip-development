import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildGuestAutomationEmail, PmsWorkspace } from './PmsWorkspace';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { createVendorPmsRecord, listVendorPmsRecords, listVendorTeamMembers, updateVendorPmsRecord } from '../api';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
  documents: [] as Record<string, unknown>[],
  uploadDocument: vi.fn(),
}));

const accommodationAccess: ResolvedVendorAccommodationAccess = {
  vendorProfileId: 'vendor-1',
  businessType: 'hotel',
  providerFamily: 'accommodation',
  planTier: 'basic',
  enforcementMode: 'enforced',
  moduleOverrides: {},
  capabilityOverrides: {},
  approvalOverrides: {},
  isAccommodationProvider: true,
  visibleModules: ['dashboard', 'crm', 'calendar', 'inbox', 'team', 'pms', 'documents', 'settings'],
  moduleVisibility: {
    dashboard: true,
    crm: true,
    calendar: true,
    inbox: true,
    accounting: false,
    team: true,
    pms: true,
    tours: false,
    activities: false,
    fleet: false,
    ai_assistant: false,
    marketplace: false,
    subscriptions: false,
    analytics: false,
    branches: false,
    documents: true,
    settings: true,
  },
  resolvedCapabilities: {
    'bookings.manual_entry': true,
    'bookings.online_engine': false,
    'bookings.group_bookings': false,
    'bookings.ai_chatbot': false,
    'inventory.manual_updates': true,
    'inventory.ota_sync': false,
    'inventory.rule_based_rates': false,
    'inventory.dynamic_pricing': false,
    'checkin.manual': true,
    'checkin.mobile': false,
    'checkin.digital_keys': false,
    'billing.manual_folios': true,
    'billing.gst_invoice': false,
    'billing.integrated_payments': false,
    'housekeeping.room_status': true,
    'housekeeping.mobile_tasks': false,
    'housekeeping.predictive_scheduling': false,
    'staff.manual_attendance': true,
    'staff.shift_scheduling': false,
    'staff.biometric_attendance': false,
    'analytics.occupancy_reports': true,
    'analytics.operational_dashboards': false,
    'analytics.ai_forecasting': false,
    'guest.manual_communication': true,
    'guest.automated_confirmations': false,
    'guest.whatsapp_automation': false,
  },
  resolvedApprovals: {
    pricing_changes: 'vendor_owner_only',
    marketplace_publishing: 'admin_approval_required',
    payout_actions: 'open',
    refund_actions: 'open',
    guest_automation: 'open',
    ai_recommendations: 'admin_approval_required',
  },
};

vi.mock('../hooks', () => ({
  useVendorOSRecords: () => ({
    records: hookMocks.records,
    loading: false,
    error: null,
    refresh: hookMocks.refresh,
  }),
  useVendorOSRecordMutations: () => ({
    createRecord: hookMocks.createRecord,
    updateRecord: hookMocks.updateRecord,
    deleteRecord: vi.fn(),
    submitting: false,
    error: null,
  }),
  useVendorOSDocuments: () => hookMocks.documents,
  useVendorDocumentUpload: () => ({
    uploadDocument: hookMocks.uploadDocument,
    submitting: false,
    error: null,
  }),
}));

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    listVendorPmsRecords: vi.fn(),
    listVendorTeamMembers: vi.fn(),
    createVendorPmsRecord: vi.fn(),
    updateVendorPmsRecord: vi.fn(),
  };
});

describe('PmsWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.updateRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
    hookMocks.documents = [];
    hookMocks.uploadDocument.mockReset();
    vi.mocked(listVendorPmsRecords).mockReset();
    vi.mocked(listVendorTeamMembers).mockReset();
    vi.mocked(createVendorPmsRecord).mockReset();
    vi.mocked(updateVendorPmsRecord).mockReset();
    vi.mocked(listVendorPmsRecords).mockResolvedValue([]);
    vi.mocked(listVendorTeamMembers).mockResolvedValue([]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email-1' }),
    } as Response);
  });

  it('renders the PMS front desk and room grid', () => {
    render(<PmsWorkspace />);

    expect(screen.getByText('Property Management System')).toBeInTheDocument();
    expect(screen.getByText('Front Desk Command')).toBeInTheDocument();
    expect(screen.getByText('Room Grid')).toBeInTheDocument();
    expect(screen.getByText('Check In Guest')).toBeInTheDocument();
  });

  it('renders arrivals, housekeeping, guest documents, and folio controls', async () => {
    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: null,
          guest_phone: null,
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_id: 'room-101',
          title: 'Room 108 deep clean',
          status: 'assigned',
          assigned_to: null,
          due_at: '2026-07-02T13:30:00.000Z',
          created_at: '2026-07-02T08:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'folio-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          reservation_id: 'reservation-1',
          entry_type: 'room_charge',
          title: 'Room 204 folio',
          amount: 18400,
          quantity: 1,
          payment_state: 'open',
          notes: null,
          posted_at: '2026-07-02T08:00:00.000Z',
          created_at: '2026-07-02T08:00:00.000Z',
        },
      ]);

    render(<PmsWorkspace organizationId="org-1" />);

    expect(screen.getByText('Arrivals & Departures')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping Board')).toBeInTheDocument();
    expect(screen.getByText('Guest Documents')).toBeInTheDocument();
    expect(screen.getByText('Folio & Rates')).toBeInTheDocument();
    expect((await screen.findAllByText('Aarav Mehta')).length).toBeGreaterThan(0);
    expect((await screen.findAllByText('Room 108 deep clean')).length).toBeGreaterThan(0);
  });

  it('creates a property through the PMS workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'property-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Property name *'), 'Goa Luxe Villas');
    await userEvent.selectOptions(screen.getByLabelText('Property type *'), 'villa');
    await userEvent.type(screen.getByLabelText('Address'), 'Candolim Beach Road');
    await userEvent.click(screen.getByRole('button', { name: 'Create Property' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      name: 'Goa Luxe Villas',
      property_type: 'villa',
      address: 'Candolim Beach Road',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live property records when available', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    await waitFor(() => expect(screen.getAllByText('Goa Luxe Villas').length).toBeGreaterThan(0));
    expect(screen.getAllByText('villa').length).toBeGreaterThan(0);
    expect(screen.getByText('Candolim Beach Road')).toBeInTheDocument();
  });

  it('creates room inventory, reservations, housekeeping tasks, and folio entries through live PMS actions', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];
    vi.mocked(listVendorPmsRecords).mockResolvedValue([]);
    vi.mocked(createVendorPmsRecord).mockResolvedValue({ id: 'created-1' } as never);
    hookMocks.refresh.mockResolvedValue(undefined);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Room type name *'), 'Deluxe Sea View');
    await userEvent.type(screen.getByLabelText('Occupancy *'), '2');
    await userEvent.type(screen.getByLabelText('Base rate *'), '8999');
    await userEvent.click(screen.getByRole('button', { name: 'Create Room Type' }));

    await userEvent.type(screen.getByLabelText('Room number *'), '204');
    await userEvent.click(screen.getByRole('button', { name: 'Create Room' }));

    await userEvent.type(screen.getByLabelText('Guest name *'), 'Aarav Mehta');
    await userEvent.type(screen.getByLabelText('Guest email'), 'aarav@example.com');
    await userEvent.type(screen.getByLabelText('Guest phone'), '9876543210');
    await userEvent.type(screen.getByLabelText('Check-in date *'), '2026-07-02');
    await userEvent.type(screen.getByLabelText('Check-out date *'), '2026-07-04');
    await userEvent.clear(screen.getByLabelText('Adults *'));
    await userEvent.type(screen.getByLabelText('Adults *'), '2');
    await userEvent.type(screen.getByLabelText('Reservation amount'), '12000');
    await userEvent.type(screen.getByLabelText('Reservation notes'), 'Late arrival');
    await userEvent.click(screen.getByRole('button', { name: 'Create Reservation' }));

    await userEvent.type(screen.getByLabelText('Housekeeping task *'), 'Arrival room prep');
    await userEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    await userEvent.type(screen.getByLabelText('Folio title *'), 'Welcome dinner');
    await userEvent.type(screen.getByLabelText('Amount *'), '2400');
    await userEvent.click(screen.getByRole('button', { name: 'Create Folio Entry' }));

    expect(createVendorPmsRecord).toHaveBeenCalledWith(
      'room_types',
      'org-1',
      'branch-1',
      expect.objectContaining({
        property_id: 'property-1',
        name: 'Deluxe Sea View',
        occupancy: 2,
        base_rate: 8999,
      }),
    );
    expect(createVendorPmsRecord).toHaveBeenCalledWith(
      'rooms',
      'org-1',
      'branch-1',
      expect.objectContaining({
        property_id: 'property-1',
        room_number: '204',
      }),
    );
    expect(createVendorPmsRecord).toHaveBeenCalledWith(
      'reservations',
      'org-1',
      'branch-1',
      expect.objectContaining({
        property_id: 'property-1',
        guest_name: 'Aarav Mehta',
        guest_email: 'aarav@example.com',
        guest_phone: '9876543210',
        adults: 2,
        payment_status: 'pending',
        total_amount: 12000,
        notes: 'Late arrival',
      }),
    );
    expect(createVendorPmsRecord).toHaveBeenCalledWith(
      'housekeeping',
      'org-1',
      'branch-1',
      expect.objectContaining({
        property_id: 'property-1',
        title: 'Arrival room prep',
      }),
    );
    expect(createVendorPmsRecord).toHaveBeenCalledWith(
      'folios',
      'org-1',
      'branch-1',
      expect.objectContaining({
        property_id: 'property-1',
        title: 'Welcome dinner',
        amount: 2400,
      }),
    );
  }, 30000);

  it('shows accommodation access guidance for PMS features', () => {
    render(<PmsWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Mobile check-in')).toBeInTheDocument();
    expect(screen.getByText('Locked on basic')).toBeInTheDocument();
    expect(screen.getByText('GST folios')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to unlock')).toBeInTheDocument();
  });

  it('runs check-in and check-out lifecycle actions with room and housekeeping updates', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: null,
          room_number: '101',
          floor: '1',
          status: 'reserved',
          housekeeping_status: 'clean',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: 'Late arrival',
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    vi.mocked(updateVendorPmsRecord).mockResolvedValue({ id: 'updated-1' } as never);
    vi.mocked(createVendorPmsRecord).mockResolvedValue({ id: 'task-1' } as never);

    const view = render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    await screen.findByRole('button', { name: 'Check In' });

    await userEvent.click(screen.getByRole('button', { name: 'Check In' }));

    await waitFor(() => {
      expect(updateVendorPmsRecord).toHaveBeenCalledWith('reservations', 'org-1', 'reservation-1', { status: 'checked_in' });
    });
    expect(updateVendorPmsRecord).toHaveBeenCalledWith('rooms', 'org-1', 'room-101', {
      status: 'occupied',
      housekeeping_status: 'in_progress',
    });

    vi.mocked(updateVendorPmsRecord).mockClear();
    vi.mocked(createVendorPmsRecord).mockClear();
    view.unmount();
    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: null,
          room_number: '101',
          floor: '1',
          status: 'occupied',
          housekeeping_status: 'in_progress',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'checked_in',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: 'Late arrival',
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);
    await screen.findByRole('button', { name: 'Check Out' });

    await userEvent.click(screen.getByRole('button', { name: 'Check Out' }));

    await waitFor(() => {
      expect(updateVendorPmsRecord).toHaveBeenCalledWith('reservations', 'org-1', 'reservation-1', { status: 'checked_out' });
    });
    expect(updateVendorPmsRecord).toHaveBeenCalledWith('rooms', 'org-1', 'room-101', {
      status: 'dirty',
      housekeeping_status: 'dirty',
    });
    expect(createVendorPmsRecord).toHaveBeenCalledWith('housekeeping', 'org-1', 'branch-1', {
      property_id: 'property-1',
      room_id: 'room-101',
      title: 'Post-checkout cleaning for Aarav Mehta',
      status: 'pending',
    });
  });

  it('syncs room readiness when housekeeping tasks are completed', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: null,
          room_number: '101',
          floor: '1',
          status: 'dirty',
          housekeeping_status: 'dirty',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_id: 'room-101',
          title: 'Post-checkout cleaning',
          status: 'pending',
          assigned_to: null,
          due_at: null,
          created_at: '2026-07-02T08:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([]);

    vi.mocked(updateVendorPmsRecord).mockResolvedValue({ id: 'updated-1' } as never);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    const taskTitle = (await screen.findAllByText('Post-checkout cleaning'))[0];
    const taskCard = taskTitle.closest('.rounded-xl');

    expect(taskCard).not.toBeNull();
    const statusSelect = taskCard?.querySelector('select');

    expect(statusSelect).not.toBeNull();
    await userEvent.selectOptions(statusSelect as HTMLSelectElement, 'done');

    await waitFor(() => {
      expect(updateVendorPmsRecord).toHaveBeenCalledWith('housekeeping', 'org-1', 'task-1', { status: 'done' });
    });
    expect(updateVendorPmsRecord).toHaveBeenCalledWith('rooms', 'org-1', 'room-101', {
      housekeeping_status: 'clean',
      status: 'available',
    });
  });

  it('prioritizes housekeeping dispatch for dirty rooms tied to upcoming arrivals', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: null,
          room_number: '101',
          floor: '1',
          status: 'dirty',
          housekeeping_status: 'dirty',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_id: 'room-101',
          title: 'Deep clean before check-in',
          status: 'pending',
          assigned_to: null,
          due_at: '2026-07-02T11:00:00.000Z',
          created_at: '2026-07-02T08:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([]);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByText('Housekeeping Board')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Queue')).toBeInTheDocument();
    expect(screen.getByText('Arrival first')).toBeInTheDocument();
    expect(screen.getByText('1 urgent room release')).toBeInTheDocument();
  });

  it('assigns housekeeping owners and due times from the dispatch board', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: null,
          room_number: '101',
          floor: '1',
          status: 'dirty',
          housekeeping_status: 'dirty',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'task-1',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_id: 'room-101',
          title: 'Deep clean before check-in',
          status: 'pending',
          assigned_to: null,
          due_at: null,
          created_at: '2026-07-02T08:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([]);

    vi.mocked(listVendorTeamMembers).mockResolvedValue([
      {
        id: 'member-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        user_id: 'user-1',
        role: 'staff',
        title: 'Housekeeping',
        display_name: 'Priya Nair',
        invited_email: 'priya@example.com',
        invited_by: 'owner-1',
        accepted_at: '2026-07-01T09:00:00.000Z',
        status: 'active',
        is_active: true,
        created_at: '2026-07-01T09:00:00.000Z',
      },
    ] as never);
    vi.mocked(updateVendorPmsRecord).mockResolvedValue({ id: 'task-1' } as never);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByText('Dispatch Queue')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Assign owner for Deep clean before check-in'), 'member-1');
    await userEvent.type(screen.getByLabelText('Set due time for Deep clean before check-in'), '13:30');
    await userEvent.click(screen.getByRole('button', { name: 'Save Dispatch' }));

    await waitFor(() => {
      expect(updateVendorPmsRecord).toHaveBeenCalledWith(
        'housekeeping',
        'org-1',
        'task-1',
        expect.objectContaining({
          assigned_to: 'member-1',
          status: 'assigned',
        }),
      );
    });
    expect(screen.getByText('Dispatch updated for Deep clean before check-in')).toBeInTheDocument();
  });

  it('tracks guest arrival readiness, uploads guest documents, and marks them verified', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];
    hookMocks.documents = [
      {
        id: 'doc-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        uploaded_by: 'user-1',
        module: 'documents',
        entity_type: 'vendor_pms_reservation',
        entity_id: 'reservation-1',
        name: 'Aarav passport',
        document_type: 'guest_identity',
        storage_path: 'organizations/org-1/guest/passport.pdf',
        mime_type: 'application/pdf',
        file_size_bytes: 1024,
        status: 'active',
        metadata: {
          verification_status: 'submitted',
        },
        created_at: '2026-07-02T10:00:00.000Z',
      },
    ];

    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: null,
          room_number: '101',
          floor: '1',
          status: 'reserved',
          housekeeping_status: 'clean',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    hookMocks.uploadDocument.mockResolvedValue({ id: 'doc-2' });
    hookMocks.updateRecord.mockResolvedValue({ id: 'doc-1' });
    hookMocks.refresh.mockResolvedValue(undefined);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByText('Guest Arrival Readiness')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();

    const file = new File(['passport'], 'passport.pdf', { type: 'application/pdf' });
    const uploadInput = screen.getByLabelText('Upload guest document for Aarav Mehta');
    await userEvent.upload(uploadInput, file);
    await userEvent.click(screen.getByRole('button', { name: 'Upload ID' }));

    expect(hookMocks.uploadDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Aarav Mehta identity document',
        document_type: 'guest_identity',
        entityType: 'vendor_pms_reservation',
        entityId: 'reservation-1',
        metadata: expect.objectContaining({
          verification_status: 'submitted',
          guest_name: 'Aarav Mehta',
        }),
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mark Verified' }));

    expect(hookMocks.updateRecord).toHaveBeenCalledWith(
      'doc-1',
      expect.objectContaining({
        metadata: expect.objectContaining({
          verification_status: 'verified',
        }),
      }),
    );
  });

  it('surfaces booking conflicts and blocks overlapping reservation creation', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([
        {
          id: 'room-type-1',
          organization_id: 'org-1',
          property_id: 'property-1',
          name: 'Deluxe',
          occupancy: 2,
          base_rate: 8999,
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: 'room-type-1',
          room_number: '101',
          floor: '1',
          status: 'reserved',
          housekeeping_status: 'clean',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Existing Guest',
          guest_email: 'existing@example.com',
          guest_phone: '9999999999',
          check_in_date: '2026-07-05',
          check_out_date: '2026-07-07',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 10000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByText('Availability & Booking Controls')).toBeInTheDocument();
    expect(screen.getByText('Room 101')).toBeInTheDocument();
    expect(screen.getByText('Held')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Guest name *'), 'New Guest');
    await userEvent.selectOptions(screen.getByDisplayValue('Assign room'), 'room-101');
    await userEvent.type(screen.getByLabelText('Check-in date *'), '2026-07-06');
    await userEvent.type(screen.getByLabelText('Check-out date *'), '2026-07-08');
    await userEvent.click(screen.getByRole('button', { name: 'Create Reservation' }));

    expect(createVendorPmsRecord).not.toHaveBeenCalledWith(
      'reservations',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    expect(screen.getByText('Room 101 already has an overlapping active reservation for the selected dates.')).toBeInTheDocument();
  });

  it('builds booking confirmations and pre-arrival reminders from reservation data', () => {
    const confirmation = buildGuestAutomationEmail(
      {
        guest: 'Aarav Mehta',
        room: 'Room 101',
        time: '2 Jul 2026 -> 4 Jul 2026',
        docs: 'pending',
        amount: 12000,
        notes: 'Late arrival',
        source: 'direct',
        propertyId: 'property-1',
      },
      [{ id: 'property-1', name: 'Goa Luxe Villas' }],
      'confirmation',
    );

    expect(confirmation.subject).toContain('Booking confirmed at Goa Luxe Villas');
    expect(confirmation.html).toContain('Aarav Mehta');
    expect(confirmation.html).toContain('Room 101');
    expect(confirmation.html).toContain('Late arrival');

    const reminder = buildGuestAutomationEmail(
      {
        guest: 'Aarav Mehta',
        room: 'Room 101',
        time: '2 Jul 2026 -> 4 Jul 2026',
        docs: 'pending',
        amount: 12000,
        notes: '',
        source: 'direct',
        propertyId: 'property-1',
      },
      [{ id: 'property-1', name: 'Goa Luxe Villas' }],
      'reminder',
    );

    expect(reminder.subject).toContain('Pre-arrival reminder for Goa Luxe Villas');
    expect(reminder.html).toContain('coming up soon');
    expect(reminder.html).toContain('Reservation source: direct');
  });

  it('blocks guest automation when a reservation has no guest email', async () => {
    hookMocks.records = [
      {
        id: 'property-1',
        organization_id: 'org-1',
        name: 'Goa Luxe Villas',
        property_type: 'villa',
        address: 'Candolim Beach Road',
        is_active: true,
      },
    ];

    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'room-101',
          organization_id: 'org-1',
          property_id: 'property-1',
          room_type_id: null,
          room_number: '101',
          floor: '1',
          status: 'reserved',
          housekeeping_status: 'clean',
          metadata: {},
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: null,
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-01T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    render(<PmsWorkspace organizationId="org-1" branchId="branch-1" />);

    await screen.findByRole('button', { name: 'Send Confirmation' });

    expect(screen.getByRole('button', { name: 'Send Confirmation' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send Reminder' })).toBeDisabled();
    expect(screen.getByText('Guest email required for automation')).toBeInTheDocument();
  });
});
