import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsWorkspace } from './AnalyticsWorkspace';

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

describe('AnalyticsWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders executive reports, branch comparison, category performance, operational KPIs, and exports', () => {
    render(<AnalyticsWorkspace />);

    expect(screen.getByText('Analytics & Reporting')).toBeInTheDocument();
    expect(screen.getByText('Executive Reports')).toBeInTheDocument();
    expect(screen.getByText('Branch Comparison')).toBeInTheDocument();
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
    expect(screen.getByText('Operational KPIs')).toBeInTheDocument();
    expect(screen.getByText('Export Center')).toBeInTheDocument();
    expect(screen.getByText('Goa Branch')).toBeInTheDocument();
    expect(screen.getByText('Export Report')).toBeInTheDocument();
    expect(screen.getByText('Compare Branches')).toBeInTheDocument();
  });

  it('creates an analytics snapshot through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'snapshot-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<AnalyticsWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.selectOptions(screen.getByLabelText('Module *'), 'marketplace');
    await userEvent.type(screen.getByLabelText('Snapshot date *'), '2026-06-05');
    await userEvent.type(screen.getByLabelText('Metric label *'), 'Conversion');
    await userEvent.type(screen.getByLabelText('Metric value *'), '9.2%');
    await userEvent.click(screen.getByRole('button', { name: 'Create Snapshot' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      module: 'marketplace',
      snapshot_date: '2026-06-05',
      metric_label: 'Conversion',
      metric_value: '9.2%',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live analytics snapshots when available', () => {
    hookMocks.records = [
      {
        id: 'snapshot-1',
        organization_id: 'org-1',
        module: 'marketplace',
        snapshot_date: '2026-06-05',
        metric_label: 'Conversion',
        metric_value: '9.2%',
      },
    ];

    render(<AnalyticsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Marketplace Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Conversion')).toBeInTheDocument();
    expect(screen.getByText('9.2%')).toBeInTheDocument();
    expect(screen.getByText('2026-06-05')).toBeInTheDocument();
  });
});
