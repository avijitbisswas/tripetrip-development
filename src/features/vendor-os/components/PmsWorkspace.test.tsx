import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PmsWorkspace } from './PmsWorkspace';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { createVendorPmsRecord, listVendorPmsRecords, updateVendorPmsRecord } from '../api';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
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
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    submitting: false,
    error: null,
  }),
}));

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    listVendorPmsRecords: vi.fn(),
    createVendorPmsRecord: vi.fn(),
    updateVendorPmsRecord: vi.fn(),
  };
});

describe('PmsWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
    vi.mocked(listVendorPmsRecords).mockReset();
    vi.mocked(createVendorPmsRecord).mockReset();
    vi.mocked(updateVendorPmsRecord).mockReset();
    vi.mocked(listVendorPmsRecords).mockResolvedValue([]);
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
    expect(await screen.findByText('Aarav Mehta')).toBeInTheDocument();
    expect(await screen.findByText('Room 108 deep clean')).toBeInTheDocument();
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
    await userEvent.type(screen.getByLabelText('Check-in date *'), '2026-07-02');
    await userEvent.type(screen.getByLabelText('Check-out date *'), '2026-07-04');
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
  });

  it('shows accommodation access guidance for PMS features', () => {
    render(<PmsWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Mobile check-in')).toBeInTheDocument();
    expect(screen.getByText('Locked on basic')).toBeInTheDocument();
    expect(screen.getByText('GST folios')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to unlock')).toBeInTheDocument();
  });
});
