import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketplaceWorkspace } from './MarketplaceWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
}));

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

    await userEvent.type(screen.getByLabelText('Listing title *'), 'Private Villa Goa');
    await userEvent.type(screen.getByLabelText('Public slug'), 'private-villa-goa');
    await userEvent.selectOptions(screen.getByLabelText('Source module *'), 'pms');
    await userEvent.selectOptions(screen.getByLabelText('Sync status *'), 'synced');
    await userEvent.click(screen.getByLabelText('Direct deal enabled'));
    await userEvent.type(screen.getByLabelText('Deal badge'), '30% off');
    await userEvent.type(screen.getByLabelText('Conversion rate'), '8.4');
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
});
