import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountingWorkspace } from './AccountingWorkspace';

describe('AccountingWorkspace', () => {
  it('renders invoices, expenses, payouts, tax, ledger, and export controls', () => {
    render(<AccountingWorkspace />);

    expect(screen.getByText('Accounting')).toBeInTheDocument();
    expect(screen.getByText('Receivables Command')).toBeInTheDocument();
    expect(screen.getByText('Expense Desk')).toBeInTheDocument();
    expect(screen.getByText('Payouts & Commissions')).toBeInTheDocument();
    expect(screen.getByText('Tax & Ledger')).toBeInTheDocument();
    expect(screen.getByText('INV-2048')).toBeInTheDocument();
    expect(screen.getByText('Create Invoice')).toBeInTheDocument();
    expect(screen.getByText('Export Ledger')).toBeInTheDocument();
  });
});
