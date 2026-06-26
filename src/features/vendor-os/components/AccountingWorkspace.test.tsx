import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { AccountingWorkspace } from './AccountingWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
}));

const accommodationAccess: ResolvedVendorAccommodationAccess = {
  vendorProfileId: 'vendor-1',
  businessType: 'hotel',
  providerFamily: 'accommodation',
  planTier: 'basic',
  enforcementMode: 'enforced',
  moduleOverrides: {},
  capabilityOverrides: {},
  approvalOverrides: {},
  isAccommodationProvider: true,
  visibleModules: ['dashboard', 'crm', 'calendar', 'inbox', 'accounting', 'team', 'pms', 'documents', 'settings'],
  moduleVisibility: {
    dashboard: true,
    crm: true,
    calendar: true,
    inbox: true,
    accounting: true,
    team: true,
    pms: true,
    tours: false,
    activities: false,
    fleet: false,
    ai_assistant: false,
    marketplace: false,
    subscriptions: false,
    analytics: false,
    branches: false,
    documents: true,
    settings: true,
  },
  resolvedCapabilities: {
    'bookings.manual_entry': true,
    'bookings.online_engine': false,
    'bookings.group_bookings': false,
    'bookings.ai_chatbot': false,
    'inventory.manual_updates': true,
    'inventory.ota_sync': false,
    'inventory.rule_based_rates': false,
    'inventory.dynamic_pricing': false,
    'checkin.manual': true,
    'checkin.mobile': false,
    'checkin.digital_keys': false,
    'billing.manual_folios': true,
    'billing.gst_invoice': false,
    'billing.integrated_payments': false,
    'housekeeping.room_status': true,
    'housekeeping.mobile_tasks': false,
    'housekeeping.predictive_scheduling': false,
    'staff.manual_attendance': true,
    'staff.shift_scheduling': false,
    'staff.biometric_attendance': false,
    'analytics.occupancy_reports': true,
    'analytics.operational_dashboards': false,
    'analytics.ai_forecasting': false,
    'guest.manual_communication': true,
    'guest.automated_confirmations': false,
    'guest.whatsapp_automation': false,
  },
  resolvedApprovals: {
    pricing_changes: 'vendor_owner_only',
    marketplace_publishing: 'admin_approval_required',
    payout_actions: 'open',
    refund_actions: 'open',
    guest_automation: 'open',
    ai_recommendations: 'admin_approval_required',
  },
};

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

  it('shows accommodation finance guidance for approvals and billing features', () => {
    render(<AccountingWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Integrated payments')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to unlock')).toBeInTheDocument();
    expect(screen.getByText('Payout actions')).toBeInTheDocument();
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
  });
});
