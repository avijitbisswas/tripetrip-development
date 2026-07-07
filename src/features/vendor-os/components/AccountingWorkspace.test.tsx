import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { createVendorAccountingRecord, listVendorAccountingRecords, listVendorPmsRecords, updateVendorPmsRecord } from '../api';
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

vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    listVendorAccountingRecords: vi.fn(),
    createVendorAccountingRecord: vi.fn(),
    listVendorPmsRecords: vi.fn(),
    updateVendorPmsRecord: vi.fn(),
  };
});

describe('AccountingWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
    vi.mocked(listVendorAccountingRecords).mockReset();
    vi.mocked(createVendorAccountingRecord).mockReset();
    vi.mocked(listVendorPmsRecords).mockReset();
    vi.mocked(updateVendorPmsRecord).mockReset();
    vi.mocked(listVendorAccountingRecords).mockResolvedValue([]);
    vi.mocked(listVendorPmsRecords).mockResolvedValue([]);
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

  it('creates live payment records and renders settlement activity', async () => {
    vi.mocked(listVendorAccountingRecords).mockResolvedValueOnce([
      {
        id: 'payment-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        reservation_id: 'reservation-1',
        folio_entry_id: null,
        manual_payment_intent_id: 'manual_1',
        payment_method: 'upi',
        amount: 5400,
        status: 'pending_approval',
        reference_number: 'RES-1-UPI',
        collected_at: '2026-07-02T10:00:00.000Z',
        collected_by: 'Front Desk',
        notes: 'Awaiting finance approval',
        created_at: '2026-07-02T10:00:00.000Z',
      } as never,
    ]);
    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'folio-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          reservation_id: 'reservation-1',
          entry_type: 'room_charge',
          title: 'Room charge',
          amount: 5400,
          quantity: 1,
          payment_state: 'open',
          notes: null,
          posted_at: '2026-07-02T10:00:00.000Z',
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 12000,
          source: 'manual',
          notes: null,
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'folio-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          reservation_id: 'reservation-1',
          entry_type: 'room_charge',
          title: 'Room charge',
          amount: 5400,
          quantity: 1,
          payment_state: 'open',
          notes: null,
          posted_at: '2026-07-02T10:00:00.000Z',
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never);
    vi.mocked(createVendorAccountingRecord).mockResolvedValue({ id: 'payment-2' } as never);

    render(<AccountingWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByRole('option', { name: 'Aarav Mehta (2026-07-02)' })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Reservation reference *'), 'reservation-1');
    await userEvent.selectOptions(screen.getByLabelText('Folio entry'), 'folio-1');
    await userEvent.type(screen.getByLabelText('Payment amount *'), '5400');
    await userEvent.selectOptions(screen.getByLabelText('Payment method *'), 'upi');
    await userEvent.click(screen.getByRole('button', { name: 'Record Payment' }));

    expect(createVendorAccountingRecord).toHaveBeenCalledWith(
      'payments',
      'org-1',
      'branch-1',
      expect.objectContaining({
        reservation_id: 'reservation-1',
        folio_entry_id: 'folio-1',
        amount: 5400,
        payment_method: 'upi',
      }),
    );
    expect(screen.getByText('Room charge')).toBeInTheDocument();
  });

  it('syncs folio and reservation payment state for recorded payments', async () => {
    vi.mocked(listVendorAccountingRecords).mockResolvedValueOnce([]);
    vi.mocked(listVendorPmsRecords)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'pending',
          total_amount: 5400,
          source: 'manual',
          notes: null,
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'folio-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          reservation_id: 'reservation-1',
          entry_type: 'room_charge',
          title: 'Room charge',
          amount: 5400,
          quantity: 1,
          payment_state: 'open',
          notes: null,
          posted_at: '2026-07-02T10:00:00.000Z',
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'payment-2',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          reservation_id: 'reservation-1',
          folio_entry_id: 'folio-1',
          manual_payment_intent_id: 'manual_2',
          payment_method: 'cash',
          amount: 5400,
          status: 'recorded',
          reference_number: null,
          collected_at: '2026-07-02T11:00:00.000Z',
          collected_by: 'Front Desk',
          notes: null,
          created_at: '2026-07-02T11:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'reservation-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          room_id: 'room-101',
          guest_name: 'Aarav Mehta',
          guest_email: 'aarav@example.com',
          guest_phone: '9876543210',
          check_in_date: '2026-07-02',
          check_out_date: '2026-07-04',
          adults: 2,
          children: 0,
          status: 'reserved',
          payment_status: 'paid',
          total_amount: 5400,
          source: 'manual',
          notes: null,
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never)
      .mockResolvedValueOnce([
        {
          id: 'folio-1',
          organization_id: 'org-1',
          branch_id: 'branch-1',
          property_id: 'property-1',
          reservation_id: 'reservation-1',
          entry_type: 'room_charge',
          title: 'Room charge',
          amount: 5400,
          quantity: 1,
          payment_state: 'settled',
          notes: null,
          posted_at: '2026-07-02T10:00:00.000Z',
          created_at: '2026-07-02T10:00:00.000Z',
        },
      ] as never);
    vi.mocked(createVendorAccountingRecord).mockResolvedValue({ id: 'payment-2' } as never);
    vi.mocked(updateVendorPmsRecord).mockResolvedValue({ id: 'updated-1' } as never);

    render(<AccountingWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByRole('option', { name: 'Aarav Mehta (2026-07-02)' })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Reservation reference *'), 'reservation-1');
    await userEvent.selectOptions(screen.getByLabelText('Folio entry'), 'folio-1');
    await userEvent.type(screen.getByLabelText('Payment amount *'), '5400');
    await userEvent.selectOptions(screen.getByLabelText('Payment method *'), 'cash');
    await userEvent.click(screen.getByRole('button', { name: 'Record Payment' }));

    await waitFor(() => {
      expect(updateVendorPmsRecord).toHaveBeenCalledWith('folios', 'org-1', 'folio-1', { payment_state: 'settled' });
    });
    expect(updateVendorPmsRecord).toHaveBeenCalledWith('reservations', 'org-1', 'reservation-1', { payment_status: 'paid' });
  });
});
