import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketplaceWorkspace } from './MarketplaceWorkspace';
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
    marketplace: true,
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

describe('MarketplaceWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders listing sync, direct deals, conversion, inventory mapping, and publishing controls', () => {
    render(<MarketplaceWorkspace />);

    expect(screen.getByText('Marketplace Listing Management')).toBeInTheDocument();
    expect(screen.getByText('Listing Sync Command')).toBeInTheDocument();
    expect(screen.getByText('Direct Deals Desk')).toBeInTheDocument();
    expect(screen.getByText('Inventory Mapping')).toBeInTheDocument();
    expect(screen.getByText('Conversion Health')).toBeInTheDocument();
    expect(screen.getByText('Publishing Queue')).toBeInTheDocument();
    expect(screen.getAllByText('Goa Beach Escape')).toHaveLength(2);
    expect(screen.getByText('Sync Listing')).toBeInTheDocument();
    expect(screen.getByText('Create Flash Sale')).toBeInTheDocument();
  });

  it('creates a marketplace sync from the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'sync-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<MarketplaceWorkspace organizationId="org-1" branchId="branch-1" />);

    fireEvent.change(screen.getByLabelText('Listing title *'), { target: { value: 'Private Villa Goa' } });
    fireEvent.change(screen.getByLabelText('Public slug'), { target: { value: 'private-villa-goa' } });
    fireEvent.change(screen.getByLabelText('Source module *'), { target: { value: 'pms' } });
    fireEvent.change(screen.getByLabelText('Sync status *'), { target: { value: 'synced' } });
    await userEvent.click(screen.getByLabelText('Direct deal enabled'));
    fireEvent.change(screen.getByLabelText('Deal badge'), { target: { value: '30% off' } });
    fireEvent.change(screen.getByLabelText('Conversion rate'), { target: { value: '8.4' } });
    await userEvent.click(screen.getByRole('button', { name: 'Create Listing Sync' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      listing_title: 'Private Villa Goa',
      public_slug: 'private-villa-goa',
      module: 'pms',
      sync_status: 'synced',
      conversion_rate: 8.4,
      direct_deal_enabled: true,
      deal_badge: '30% off',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live marketplace sync records when available', () => {
    hookMocks.records = [
      {
        id: 'sync-1',
        organization_id: 'org-1',
        module: 'pms',
        sync_status: 'synced',
        conversion_rate: 8.4,
        last_synced_at: '2026-06-08T10:00:00.000Z',
        metadata: {
          listing_title: 'Private Villa Goa',
          public_slug: 'private-villa-goa',
          direct_deal_enabled: true,
          deal_badge: '30% off',
        },
      },
    ];

    render(<MarketplaceWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Private Villa Goa')).toBeInTheDocument();
    expect(screen.getByText('PMS source')).toBeInTheDocument();
    expect(screen.getByText('private-villa-goa')).toBeInTheDocument();
    expect(screen.getByText('30% off direct deal')).toBeInTheDocument();
    expect(screen.getByText('8.4% conversion')).toBeInTheDocument();
  });

  it('shows accommodation approval guidance for marketplace actions', () => {
    render(<MarketplaceWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Publishing')).toBeInTheDocument();
    expect(screen.getByText('Admin approval')).toBeInTheDocument();
    expect(screen.getByText('Pricing changes')).toBeInTheDocument();
    expect(screen.getByText('Owner approval')).toBeInTheDocument();
  });
});
