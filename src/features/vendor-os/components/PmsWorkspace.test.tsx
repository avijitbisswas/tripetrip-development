import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PmsWorkspace } from './PmsWorkspace';
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

describe('PmsWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders the PMS front desk and room grid', () => {
    render(<PmsWorkspace />);

    expect(screen.getByText('Property Management System')).toBeInTheDocument();
    expect(screen.getByText('Front Desk Command')).toBeInTheDocument();
    expect(screen.getByText('Room Grid')).toBeInTheDocument();
    expect(screen.getAllByText('Room 204').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Villa 3').length).toBeGreaterThan(0);
    expect(screen.getByText('Check In Guest')).toBeInTheDocument();
  });

  it('renders arrivals, housekeeping, guest documents, and folio controls', () => {
    render(<PmsWorkspace />);

    expect(screen.getByText('Arrivals & Departures')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping Board')).toBeInTheDocument();
    expect(screen.getByText('Guest Documents')).toBeInTheDocument();
    expect(screen.getByText('Folio & Rates')).toBeInTheDocument();
    expect(screen.getAllByText('Aarav Mehta').length).toBeGreaterThan(0);
    expect(screen.getByText('Room 108 deep clean')).toBeInTheDocument();
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

  it('renders live property records when available', () => {
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

    expect(screen.getByText('Goa Luxe Villas')).toBeInTheDocument();
    expect(screen.getAllByText('villa').length).toBeGreaterThan(0);
    expect(screen.getByText('Candolim Beach Road')).toBeInTheDocument();
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
