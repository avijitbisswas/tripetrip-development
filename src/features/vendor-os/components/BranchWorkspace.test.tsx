import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchWorkspace } from './BranchWorkspace';

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

describe('BranchWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders multi-branch operating sections and controls', () => {
    render(<BranchWorkspace />);

    expect(screen.getByText('Multi-branch Support')).toBeInTheDocument();
    expect(screen.getByText('Branch Registry')).toBeInTheDocument();
    expect(screen.getByText('Category Mix')).toBeInTheDocument();
    expect(screen.getByText('Local Controls')).toBeInTheDocument();
    expect(screen.getByText('Operating Policies')).toBeInTheDocument();
    expect(screen.getByText('Manali Hotel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Branch' })).toBeInTheDocument();
  });

  it('creates a branch through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'branch-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<BranchWorkspace organizationId="org-1" />);

    await userEvent.type(screen.getByLabelText('Branch name *'), 'Jaipur DMC Desk');
    await userEvent.type(screen.getByLabelText('City'), 'Jaipur');
    await userEvent.type(screen.getByLabelText('Country'), 'India');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'active');
    await userEvent.click(screen.getByRole('button', { name: 'Create Branch' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      name: 'Jaipur DMC Desk',
      city: 'Jaipur',
      country: 'India',
      is_active: true,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live branch records when available', () => {
    hookMocks.records = [
      {
        id: 'branch-1',
        organization_id: 'org-1',
        name: 'Jaipur DMC Desk',
        city: 'Jaipur',
        country: 'India',
        is_active: true,
      },
    ];

    render(<BranchWorkspace organizationId="org-1" />);

    expect(screen.getByText('Jaipur DMC Desk')).toBeInTheDocument();
    expect(screen.getByText('Jaipur, India')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });
});
