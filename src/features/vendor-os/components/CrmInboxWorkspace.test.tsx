import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmInboxWorkspace } from './CrmInboxWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  recordsByModule: {} as Record<string, Record<string, unknown>[]>,
}));

vi.mock('../hooks', () => ({
  useVendorOSRecords: (module: string) => ({
    records: hookMocks.recordsByModule[module] || [],
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

describe('CrmInboxWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.recordsByModule = {};
  });

  it('renders CRM pipeline stages, leads, and follow-up queue', () => {
    render(<CrmInboxWorkspace mode="crm" />);

    expect(screen.getByText('CRM Command Center')).toBeInTheDocument();
    expect(screen.getAllByText('New').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Qualified').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quote Sent').length).toBeGreaterThan(0);
    expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
    expect(screen.getByText('Follow-up Queue')).toBeInTheDocument();
    expect(screen.getByText('Send Goa villa quote')).toBeInTheDocument();
  });

  it('renders inbox conversations and reply tools', () => {
    render(<CrmInboxWorkspace mode="inbox" />);

    expect(screen.getByText('Inbox Command Center')).toBeInTheDocument();
    expect(screen.getByText('Traveler Inbox')).toBeInTheDocument();
    expect(screen.getByText('Goa booking question')).toBeInTheDocument();
    expect(screen.getAllByText('AI Reply Draft').length).toBeGreaterThan(0);
    expect(screen.getByText('Assign Thread')).toBeInTheDocument();
  });

  it('creates a CRM lead through the live form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'lead-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<CrmInboxWorkspace mode="crm" organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Lead title *'), 'Goa villa group inquiry');
    await userEvent.selectOptions(screen.getByLabelText('Stage'), 'qualified');
    await userEvent.type(screen.getByLabelText('Estimated value'), '125000');
    await userEvent.click(screen.getByRole('button', { name: 'Create Lead' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      title: 'Goa villa group inquiry',
      stage: 'qualified',
      estimated_value: 125000,
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('creates an inbox thread through the live form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'thread-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<CrmInboxWorkspace mode="inbox" organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Subject *'), 'Late checkout request');
    await userEvent.selectOptions(screen.getByLabelText('Channel'), 'whatsapp');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'assigned');
    await userEvent.click(screen.getByRole('button', { name: 'Create Thread' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      subject: 'Late checkout request',
      channel: 'whatsapp',
      status: 'assigned',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });
});
