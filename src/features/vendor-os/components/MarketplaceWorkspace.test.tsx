import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketplaceWorkspace } from './MarketplaceWorkspace';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
  propertyRecords: [] as Record<string, unknown>[],
}));

const apiMocks = vi.hoisted(() => ({
  listVendorPmsRecords: vi.fn(),
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
  useVendorOSRecords: (module: string) => ({
    records: module === 'pms' ? hookMocks.propertyRecords : hookMocks.records,
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
}));

vi.mock('../api', () => ({
  listVendorPmsRecords: apiMocks.listVendorPmsRecords,
}));

describe('MarketplaceWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.updateRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
    hookMocks.propertyRecords = [];
    apiMocks.listVendorPmsRecords.mockReset();
    apiMocks.listVendorPmsRecords.mockImplementation(async (resource: string) => {
      if (resource === 'room_types') {
        return [
          {
            id: 'room-type-1',
            organization_id: 'org-1',
            property_id: 'property-1',
            name: 'Ocean Suite',
            occupancy: 2,
            base_rate: 7600,
            amenities: [],
            created_at: '2026-06-30T00:00:00.000Z',
          },
        ];
      }

      if (resource === 'rooms') {
        return [
          {
            id: 'room-101',
            organization_id: 'org-1',
            property_id: 'property-1',
            room_type_id: 'room-type-1',
            room_number: '101',
            floor: '1',
            status: 'available',
            housekeeping_status: 'clean',
            metadata: {},
            created_at: '2026-06-30T00:00:00.000Z',
          },
          {
            id: 'room-102',
            organization_id: 'org-1',
            property_id: 'property-1',
            room_type_id: 'room-type-1',
            room_number: '102',
            floor: '1',
            status: 'available',
            housekeeping_status: 'dirty',
            metadata: {},
            created_at: '2026-06-30T00:00:00.000Z',
          },
        ];
      }

      if (resource === 'reservations') {
        return [
          {
            id: 'reservation-1',
            organization_id: 'org-1',
            branch_id: 'branch-1',
            property_id: 'property-1',
            room_id: 'room-101',
            guest_name: 'Aarav',
            guest_email: null,
            guest_phone: null,
            check_in_date: '2026-06-30',
            check_out_date: '2026-07-02',
            adults: 2,
            children: 0,
            status: 'reserved',
            payment_status: 'pending',
            total_amount: 7600,
            source: 'manual',
            notes: null,
            created_at: '2026-06-30T00:00:00.000Z',
          },
        ];
      }

      return [];
    });
  });

  it('renders listing sync, direct deals, conversion, inventory mapping, and publishing controls', () => {
    hookMocks.propertyRecords = [{ id: 'property-1', name: 'Goa Beach Retreat' }];
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
    hookMocks.propertyRecords = [{ id: 'property-1', name: 'Goa Beach Retreat' }];

    render(<MarketplaceWorkspace organizationId="org-1" branchId="branch-1" />);
    await screen.findByText('Goa Beach Retreat');

    fireEvent.change(screen.getByLabelText('Property *'), { target: { value: 'property-1' } });
    fireEvent.change(screen.getByLabelText('Room type *'), { target: { value: 'room-type-1' } });
    fireEvent.change(screen.getByLabelText('Listing title *'), { target: { value: 'Private Villa Goa' } });
    fireEvent.change(screen.getByLabelText('Public slug'), { target: { value: 'private-villa-goa' } });
    fireEvent.change(screen.getByLabelText('Source module *'), { target: { value: 'pms' } });
    fireEvent.change(screen.getByLabelText('Listing state *'), { target: { value: 'live' } });
    fireEvent.change(screen.getByLabelText('Sync status *'), { target: { value: 'synced' } });
    fireEvent.change(screen.getByLabelText('Nightly rate'), { target: { value: '8100' } });
    await userEvent.click(screen.getByLabelText('Direct deal enabled'));
    fireEvent.change(screen.getByLabelText('Deal badge'), { target: { value: '30% off' } });
    fireEvent.change(screen.getByLabelText('Conversion rate'), { target: { value: '8.4' } });
    await userEvent.click(screen.getByRole('button', { name: 'Publish Inventory' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        listing_title: 'Private Villa Goa',
        public_slug: 'private-villa-goa',
        property_id: 'property-1',
        room_type_id: 'room-type-1',
        room_type_name: 'Ocean Suite',
        module: 'pms',
        listing_state: 'live',
        sync_status: 'synced',
        nightly_rate: 8100,
        total_inventory: 2,
        conversion_rate: 8.4,
        direct_deal_enabled: true,
        deal_badge: '30% off',
      }),
    );
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live marketplace sync records when available', () => {
    hookMocks.propertyRecords = [{ id: 'property-1', name: 'Goa Beach Retreat' }];
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
          room_type_name: 'Ocean Suite',
          property_id: 'property-1',
          room_type_id: 'room-type-1',
          total_inventory: 2,
          available_inventory: 1,
          nightly_rate: 8100,
          listing_state: 'live',
        },
      },
    ];

    render(<MarketplaceWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Private Villa Goa')).toBeInTheDocument();
    expect(screen.getByText('PMS / Ocean Suite')).toBeInTheDocument();
    expect(screen.getByText('private-villa-goa')).toBeInTheDocument();
    expect(screen.getByText('30% off direct deal')).toBeInTheDocument();
    expect(screen.getByText('8.4% conversion')).toBeInTheDocument();
    expect(screen.getByText('1/2 rooms available')).toBeInTheDocument();
    expect(screen.getByText('INR 8,100/night')).toBeInTheDocument();
  });

  it('shows accommodation approval guidance for marketplace actions', () => {
    hookMocks.propertyRecords = [{ id: 'property-1', name: 'Goa Beach Retreat' }];
    render(<MarketplaceWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Publishing')).toBeInTheDocument();
    expect(screen.getByText('Admin approval')).toBeInTheDocument();
    expect(screen.getByText('Pricing changes')).toBeInTheDocument();
    expect(screen.getByText('Owner approval')).toBeInTheDocument();
  });
});
