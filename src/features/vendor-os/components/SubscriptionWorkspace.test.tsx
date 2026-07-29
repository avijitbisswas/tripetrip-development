import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { SubscriptionWorkspace } from './SubscriptionWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
}));

const accommodationAccess: ResolvedVendorAccommodationAccess = {
  vendorProfileId: 'vendor-1',
  businessType: 'hotel',
  providerFamily: 'accommodation',
  planTier: 'paid',
  enforcementMode: 'enforced',
  moduleOverrides: {},
  capabilityOverrides: {},
  approvalOverrides: {},
  updatedAt: '2026-06-25T10:00:00.000Z',
  isAccommodationProvider: true,
  visibleModules: ['dashboard', 'team', 'documents', 'subscriptions'],
  moduleVisibility: {
    dashboard: true,
    crm: true,
    calendar: true,
    inbox: true,
    accounting: true,
    team: true,
    pms: true,
    tours: false,
    activities: false,
    fleet: false,
    ai_assistant: true,
    marketplace: true,
    subscriptions: true,
    analytics: true,
    branches: true,
    documents: true,
    settings: true,
  },
  resolvedCapabilities: {
    'bookings.manual_entry': true,
    'bookings.online_engine': true,
    'bookings.group_bookings': true,
    'bookings.reservation_changes': false,
    'bookings.rate_plan_controls': false,
    'bookings.ai_chatbot': false,
    'inventory.manual_updates': true,
    'inventory.ota_sync': true,
    'inventory.rule_based_rates': true,
    'inventory.dynamic_pricing': false,
    'checkin.manual': true,
    'checkin.mobile': true,
    'checkin.digital_keys': true,
    'billing.manual_folios': true,
    'billing.gst_invoice': true,
    'billing.integrated_payments': true,
    'billing.refund_controls': false,
    'billing.night_audit': false,
    'housekeeping.room_status': true,
    'housekeeping.mobile_tasks': true,
    'housekeeping.predictive_scheduling': false,
    'staff.manual_attendance': true,
    'staff.shift_scheduling': true,
    'staff.biometric_attendance': false,
    'analytics.occupancy_reports': true,
    'analytics.operational_dashboards': true,
    'analytics.ai_forecasting': false,
    'guest.manual_communication': true,
    'guest.automated_confirmations': true,
    'guest.whatsapp_automation': false,
  },
  resolvedApprovals: {
    pricing_changes: 'vendor_owner_only',
    marketplace_publishing: 'admin_approval_required',
    payout_actions: 'vendor_owner_only',
    refund_actions: 'vendor_owner_only',
    guest_automation: 'admin_approval_required',
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

describe('SubscriptionWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders plan, usage, add-ons, billing, entitlements, and upgrade controls', () => {
    render(<SubscriptionWorkspace />);

    expect(screen.getByText('Subscription Management')).toBeInTheDocument();
    expect(screen.getByText('Plan Control')).toBeInTheDocument();
    expect(screen.getByText('Usage Metering')).toBeInTheDocument();
    expect(screen.getByText('Add-ons & Limits')).toBeInTheDocument();
    expect(screen.getByText('Branch Entitlements')).toBeInTheDocument();
    expect(screen.getByText('Billing Events')).toBeInTheDocument();
    expect(screen.getByText('Growth Plan')).toBeInTheDocument();
    expect(screen.getByText('Change Plan')).toBeInTheDocument();
    expect(screen.getByText('Add Seats')).toBeInTheDocument();
  });

  it('creates a subscription account through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'subscription-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<SubscriptionWorkspace organizationId="org-1" />);

    await userEvent.selectOptions(screen.getByLabelText('Plan code *'), 'scale');
    await userEvent.selectOptions(screen.getByLabelText('Billing cycle *'), 'annual');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'active');
    await userEvent.type(screen.getByLabelText('Team seats'), '50');
    await userEvent.click(screen.getByRole('button', { name: 'Create Subscription' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      plan_code: 'scale',
      billing_cycle: 'annual',
      status: 'active',
      team_seats: 50,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live subscription records when available', () => {
    hookMocks.records = [
      {
        id: 'subscription-1',
        organization_id: 'org-1',
        plan_code: 'scale',
        billing_cycle: 'annual',
        status: 'active',
        team_seats: 50,
      },
    ];

    render(<SubscriptionWorkspace organizationId="org-1" />);

    expect(screen.getByText('Scale Plan')).toBeInTheDocument();
    expect(screen.getByText('Annual billing')).toBeInTheDocument();
    expect(screen.getByText('50 team seats')).toBeInTheDocument();
  });

  it('shows accommodation plan guidance for entitlements and upgrade paths', () => {
    render(<SubscriptionWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Current plan')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Dynamic pricing')).toBeInTheDocument();
    expect(screen.getByText('Advanced only')).toBeInTheDocument();
    expect(screen.getByText('Refund actions')).toBeInTheDocument();
    expect(screen.getByText('Owner approval')).toBeInTheDocument();
  });
});
