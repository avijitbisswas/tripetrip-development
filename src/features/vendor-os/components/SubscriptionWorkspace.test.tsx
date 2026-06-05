import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionWorkspace } from './SubscriptionWorkspace';

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
});
