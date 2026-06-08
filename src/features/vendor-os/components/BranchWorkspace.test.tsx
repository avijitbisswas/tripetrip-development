import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BranchWorkspace } from './BranchWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  createSettingRecord: vi.fn(),
  refresh: vi.fn(),
  refreshSettings: vi.fn(),
  branchRecords: [] as Record<string, unknown>[],
  settingRecords: [] as Record<string, unknown>[],
}));

vi.mock('../hooks', () => ({
  useVendorOSRecords: (module: string) => ({
    records: module === 'settings' ? hookMocks.settingRecords : hookMocks.branchRecords,
    loading: false,
    error: null,
    refresh: module === 'settings' ? hookMocks.refreshSettings : hookMocks.refresh,
  }),
  useVendorOSRecordMutations: (module: string) => ({
    createRecord: module === 'settings' ? hookMocks.createSettingRecord : hookMocks.createRecord,
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    submitting: false,
    error: null,
  }),
}));

describe('BranchWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.createSettingRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.refreshSettings.mockReset();
    hookMocks.branchRecords = [];
    hookMocks.settingRecords = [];
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
    hookMocks.branchRecords = [
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

    expect(screen.getAllByText('Jaipur DMC Desk').length).toBeGreaterThan(0);
    expect(screen.getByText('Jaipur, India')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
  });

  it('creates branch-level module controls for a selected branch', async () => {
    hookMocks.branchRecords = [
      {
        id: 'branch-1',
        organization_id: 'org-1',
        name: 'Manali Hotel',
        city: 'Manali',
        country: 'India',
        is_active: true,
      },
    ];
    hookMocks.createSettingRecord.mockResolvedValueOnce({ id: 'setting-1' });
    hookMocks.refreshSettings.mockResolvedValueOnce(undefined);

    render(<BranchWorkspace organizationId="org-1" />);

    await userEvent.selectOptions(screen.getByLabelText('Control branch *'), 'branch-1');
    await userEvent.selectOptions(screen.getByLabelText('Control module *'), 'pms');
    await userEvent.selectOptions(screen.getByLabelText('Module enabled *'), 'false');
    await userEvent.type(screen.getByLabelText('Branch policy note'), 'Disable PMS during renovation');
    await userEvent.click(screen.getByRole('button', { name: 'Save Branch Control' }));

    expect(hookMocks.createSettingRecord).toHaveBeenCalledWith({
      branch_id: 'branch-1',
      module: 'pms',
      is_enabled: false,
      settings: { policy_note: 'Disable PMS during renovation', source: 'branch_workspace' },
    });
    expect(hookMocks.refreshSettings).toHaveBeenCalled();
  });
});
