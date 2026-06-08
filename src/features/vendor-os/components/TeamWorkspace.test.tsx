import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamWorkspace } from './TeamWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
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
    updateRecord: hookMocks.updateRecord,
    deleteRecord: vi.fn(),
    submitting: false,
    error: null,
  }),
}));

describe('TeamWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.updateRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders team management sections and controls', () => {
    render(<TeamWorkspace />);

    expect(screen.getByText('Team Management')).toBeInTheDocument();
    expect(screen.getByText('Role Access')).toBeInTheDocument();
    expect(screen.getByText('Branch Staffing')).toBeInTheDocument();
    expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
    expect(screen.getByText('Audit Accountability')).toBeInTheDocument();
    expect(screen.getByText('Neha Kapoor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeInTheDocument();
  });

  it('creates a team invitation through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'member-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<TeamWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Email *'), 'ops@example.com');
    await userEvent.selectOptions(screen.getByLabelText('Role *'), 'manager');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'invited');
    await userEvent.type(screen.getByLabelText('Display name'), 'Ops Manager');
    await userEvent.click(screen.getByRole('button', { name: 'Invite Member' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      invited_email: 'ops@example.com',
      role: 'manager',
      status: 'invited',
      display_name: 'Ops Manager',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live team records when available', () => {
    hookMocks.records = [
      {
        id: 'member-1',
        organization_id: 'org-1',
        invited_email: 'ops@example.com',
        display_name: 'Ops Manager',
        role: 'manager',
        status: 'invited',
      },
    ];

    render(<TeamWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Ops Manager')).toBeInTheDocument();
    expect(screen.getByText('ops@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Manager').length).toBeGreaterThan(0);
  });

  it('updates a live member role and status through access review controls', async () => {
    hookMocks.records = [
      {
        id: 'member-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        invited_email: 'ops@example.com',
        display_name: 'Ops Manager',
        role: 'manager',
        status: 'invited',
      },
    ];
    hookMocks.updateRecord.mockResolvedValueOnce({ id: 'member-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<TeamWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.selectOptions(screen.getByLabelText('Review member *'), 'member-1');
    await userEvent.selectOptions(screen.getByLabelText('Reviewed role *'), 'operations');
    await userEvent.selectOptions(screen.getByLabelText('Reviewed status *'), 'active');
    await userEvent.type(screen.getByLabelText('Access review note'), 'Approved for Manali operations coverage');
    await userEvent.click(screen.getByRole('button', { name: 'Save Access Review' }));

    expect(hookMocks.updateRecord).toHaveBeenCalledWith('member-1', {
      role: 'operations',
      status: 'active',
      is_active: true,
      title: 'Approved for Manali operations coverage',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });
});
