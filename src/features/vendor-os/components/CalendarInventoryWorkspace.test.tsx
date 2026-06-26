import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CalendarInventoryWorkspace } from './CalendarInventoryWorkspace';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';

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

describe('CalendarInventoryWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders the unified calendar and inventory controls', () => {
    render(<CalendarInventoryWorkspace />);

    expect(screen.getByText('Calendar + Live Inventory')).toBeInTheDocument();
    expect(screen.getByText('Unified Availability Board')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getAllByText('Capacity Risk').length).toBeGreaterThan(0);
    expect(screen.getByText('Block Dates')).toBeInTheDocument();
    expect(screen.getByText('Sync Marketplace')).toBeInTheDocument();
  });

  it('shows inventory lanes for PMS, tours, activities, and fleet', () => {
    render(<CalendarInventoryWorkspace />);

    expect(screen.getByText('PMS Rooms')).toBeInTheDocument();
    expect(screen.getByText('Tour Departures')).toBeInTheDocument();
    expect(screen.getByText('Activity Slots')).toBeInTheDocument();
    expect(screen.getByText('Fleet Availability')).toBeInTheDocument();
    expect(screen.getByText('Manali Hotel')).toBeInTheDocument();
    expect(screen.getByText('Scuba Diving')).toBeInTheDocument();
  });

  it('creates a live calendar event through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'event-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<CalendarInventoryWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Event title *'), 'Goa villa blackout');
    await userEvent.selectOptions(screen.getByLabelText('Event type *'), 'blackout');
    await userEvent.type(screen.getByLabelText('Starts at *'), '2026-06-10T10:30');
    await userEvent.type(screen.getByLabelText('Capacity'), '4');
    await userEvent.click(screen.getByRole('button', { name: 'Create Event' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      title: 'Goa villa blackout',
      event_type: 'blackout',
      starts_at: '2026-06-10T10:30',
      capacity: 4,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live calendar records when available', () => {
    hookMocks.records = [
      {
        id: 'event-1',
        organization_id: 'org-1',
        title: 'Dubai departure hold',
        event_type: 'departure',
        starts_at: '2026-06-11T09:00:00.000Z',
        capacity: 18,
        status: 'scheduled',
      },
    ];

    render(<CalendarInventoryWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Dubai departure hold')).toBeInTheDocument();
    expect(screen.getAllByText('departure').length).toBeGreaterThan(0);
    expect(screen.getByText('18 capacity')).toBeInTheDocument();
  });

  it('shows accommodation inventory guidance for sync and pricing controls', () => {
    render(<CalendarInventoryWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('OTA sync')).toBeInTheDocument();
    expect(screen.getAllByText('Upgrade to unlock').length).toBeGreaterThan(0);
    expect(screen.getByText('Dynamic pricing')).toBeInTheDocument();
    expect(screen.getByText('Advanced only')).toBeInTheDocument();
  });
});
