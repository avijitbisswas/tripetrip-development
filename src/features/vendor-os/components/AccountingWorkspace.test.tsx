import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountingWorkspace } from './AccountingWorkspace';

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

describe('AccountingWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders invoices, expenses, payouts, tax, ledger, and export controls', () => {
    render(<AccountingWorkspace />);

    expect(screen.getByText('Accounting')).toBeInTheDocument();
    expect(screen.getByText('Receivables Command')).toBeInTheDocument();
    expect(screen.getByText('Expense Desk')).toBeInTheDocument();
    expect(screen.getByText('Payouts & Commissions')).toBeInTheDocument();
    expect(screen.getByText('Tax & Ledger')).toBeInTheDocument();
    expect(screen.getByText('INV-2048')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Invoice' })).toBeInTheDocument();
    expect(screen.getByText('Export Ledger')).toBeInTheDocument();
  });

  it('creates an invoice through the accounting workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'invoice-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<AccountingWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Invoice number *'), 'INV-3001');
    await userEvent.type(screen.getByLabelText('Booking or customer *'), 'Goa Beach Escape');
    await userEvent.type(screen.getByLabelText('Amount *'), '29999');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'due');
    await userEvent.click(screen.getByRole('button', { name: 'Create Invoice' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      record_type: 'invoice',
      invoice_number: 'INV-3001',
      booking_reference: 'Goa Beach Escape',
      amount: 29999,
      status: 'due',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live invoice records when available', () => {
    hookMocks.records = [
      {
        id: 'invoice-1',
        organization_id: 'org-1',
        record_type: 'invoice',
        invoice_number: 'INV-3001',
        booking_reference: 'Corporate Retreat',
        amount: 30500,
        status: 'due',
      },
    ];

    render(<AccountingWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('INV-3001')).toBeInTheDocument();
    expect(screen.getByText('Corporate Retreat')).toBeInTheDocument();
    expect(screen.getByText('INR 30,500')).toBeInTheDocument();
  });
});
