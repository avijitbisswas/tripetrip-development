import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsWorkspace } from './SettingsWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
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
    deleteRecord: hookMocks.deleteRecord,
    submitting: false,
    error: null,
  }),
}));

describe('SettingsWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.updateRecord.mockReset();
    hookMocks.deleteRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders settings sections and controls', () => {
    render(<SettingsWorkspace />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Business Profile')).toBeInTheDocument();
    expect(screen.getByText('Module Controls')).toBeInTheDocument();
    expect(screen.getAllByText('Integrations').length).toBeGreaterThan(0);
    expect(screen.getByText('Policy Center')).toBeInTheDocument();
    expect(screen.getByText('Backed by vendor_os_module_settings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Setting' })).toBeInTheDocument();
  });

  it('creates a module setting through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'setting-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<SettingsWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.selectOptions(screen.getByLabelText('Module *'), 'marketplace');
    await userEvent.selectOptions(screen.getByLabelText('Enabled *'), 'false');
    await userEvent.type(screen.getByLabelText('Policy note'), 'Pause public sync during audit');
    await userEvent.click(screen.getByRole('button', { name: 'Save Setting' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      module: 'marketplace',
      is_enabled: false,
      settings: { policy_note: 'Pause public sync during audit' },
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('toggles and removes live module settings', async () => {
    hookMocks.records = [
      {
        id: 'setting-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        module: 'fleet',
        is_enabled: true,
        settings: { policy_note: 'Fleet ready' },
      },
    ];
    hookMocks.updateRecord.mockResolvedValueOnce({ id: 'setting-1' });
    hookMocks.deleteRecord.mockResolvedValueOnce({ id: 'setting-1' });
    hookMocks.refresh.mockResolvedValue(undefined);

    render(<SettingsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getAllByText('Fleet').length).toBeGreaterThan(0);
    expect(screen.getByText('Fleet ready')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Disable Fleet' }));
    expect(hookMocks.updateRecord).toHaveBeenCalledWith('setting-1', { is_enabled: false });

    await userEvent.click(screen.getByRole('button', { name: 'Remove Fleet setting' }));
    expect(hookMocks.deleteRecord).toHaveBeenCalledWith('setting-1');
    expect(hookMocks.refresh).toHaveBeenCalledTimes(2);
  });
});
