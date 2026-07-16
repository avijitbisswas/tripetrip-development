import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsWorkspace } from './AnalyticsWorkspace';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { listVendorAccountingRecords, listVendorPmsRecords } from '../api';

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
  visibleModules: ['dashboard', 'crm', 'calendar', 'inbox', 'team', 'pms', 'documents', 'settings'],
  moduleVisibility: {
    dashboard: true,
    crm: true,
    calendar: true,
    inbox: true,
    accounting: false,
    team: true,
    pms: true,
    tours: false,
    activities: false,
    fleet: false,
    ai_assistant: false,
    marketplace: false,
    subscriptions: false,
    analytics: true,
    branches: false,
    documents: true,
    settings: true,
  },
  resolvedCapabilities: {
    'bookings.manual_entry': true,
    'bookings.online_engine': false,
    'bookings.group_bookings': false,
    'bookings.reservation_changes': false,
    'bookings.rate_plan_controls': false,
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
    'billing.refund_controls': false,
    'billing.night_audit': false,
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

vi.mock('../api', () => ({
  listVendorPmsRecords: vi.fn(),
  listVendorAccountingRecords: vi.fn(),
}));

describe('AnalyticsWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
    vi.mocked(listVendorPmsRecords).mockReset();
    vi.mocked(listVendorAccountingRecords).mockReset();
    vi.mocked(listVendorPmsRecords).mockResolvedValue([]);
    vi.mocked(listVendorAccountingRecords).mockResolvedValue([]);
  });

  it('renders executive reports, branch comparison, category performance, operational KPIs, and exports', () => {
    render(<AnalyticsWorkspace />);

    expect(screen.getByText('Analytics & Reporting')).toBeInTheDocument();
    expect(screen.getByText('Executive Reports')).toBeInTheDocument();
    expect(screen.getByText('Branch Comparison')).toBeInTheDocument();
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
    expect(screen.getByText('Operational KPIs')).toBeInTheDocument();
    expect(screen.getByText('Forecast & Anomaly Desk')).toBeInTheDocument();
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

  it('derives live operational reporting from reservations, folios, and payments', async () => {
    vi.mocked(listVendorPmsRecords).mockImplementation(async (resource) => {
      if (resource === 'reservations') {
        return [
          {
            id: 'reservation-1',
            organization_id: 'org-1',
            property_id: 'property-1',
            room_id: 'room-1',
            guest_name: 'Aarav Mehta',
            guest_email: 'aarav@example.com',
            guest_phone: '9999999999',
            check_in_date: '2026-06-30',
            check_out_date: '2026-07-02',
            adults: 2,
            children: 0,
            status: 'reserved',
            payment_status: 'pending',
            total_amount: 12000,
            source: 'manual',
            notes: null,
            created_at: '2026-06-25T10:00:00.000Z',
          },
          {
            id: 'reservation-2',
            organization_id: 'org-1',
            property_id: 'property-1',
            room_id: 'room-2',
            guest_name: 'Mira Sen',
            guest_email: 'mira@example.com',
            guest_phone: '8888888888',
            check_in_date: '2026-06-29',
            check_out_date: '2026-07-01',
            adults: 2,
            children: 1,
            status: 'checked_in',
            payment_status: 'paid',
            total_amount: 16000,
            source: 'manual',
            notes: null,
            created_at: '2026-06-24T10:00:00.000Z',
          },
        ] as never;
      }

      if (resource === 'folios') {
        return [
          {
            id: 'folio-1',
            organization_id: 'org-1',
            property_id: 'property-1',
            reservation_id: 'reservation-1',
            entry_type: 'room_charge',
            title: 'Deluxe room',
            amount: 12000,
            quantity: 1,
            payment_state: 'open',
            notes: null,
            posted_at: '2026-06-25T10:00:00.000Z',
            created_at: '2026-06-25T10:00:00.000Z',
          },
          {
            id: 'folio-2',
            organization_id: 'org-1',
            property_id: 'property-1',
            reservation_id: 'reservation-2',
            entry_type: 'room_charge',
            title: 'Family suite',
            amount: 16000,
            quantity: 1,
            payment_state: 'settled',
            notes: null,
            posted_at: '2026-06-24T10:00:00.000Z',
            created_at: '2026-06-24T10:00:00.000Z',
          },
        ] as never;
      }

      if (resource === 'housekeeping') {
        return [
          {
            id: 'task-1',
            organization_id: 'org-1',
            property_id: 'property-1',
            room_id: 'room-1',
            title: 'Clean room 101',
            status: 'assigned',
            assigned_to: null,
            due_at: '2026-06-30T10:00:00.000Z',
            created_at: '2026-06-25T10:00:00.000Z',
          },
        ] as never;
      }

      return [] as never;
    });
    vi.mocked(listVendorAccountingRecords).mockResolvedValue([
      {
        id: 'payment-1',
        organization_id: 'org-1',
        reservation_id: 'reservation-2',
        folio_entry_id: 'folio-2',
        manual_payment_intent_id: 'manual_1',
        payment_method: 'cash',
        amount: 16000,
        status: 'recorded',
        created_at: '2026-06-24T11:00:00.000Z',
      },
    ] as never);

    render(<AnalyticsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByText('Live Operations Pulse')).toBeInTheDocument();
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1/2 rooms occupied').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Aarav Mehta').length).toBeGreaterThan(0);
    expect(screen.getAllByText('INR 12,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('INR 16,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1 open folio / 1 settled').length).toBeGreaterThan(0);
    expect(screen.getByText('Forecast & Anomaly Desk')).toBeInTheDocument();
    expect(screen.getByText('Demand forecast')).toBeInTheDocument();
    expect(screen.getByText('Revenue anomaly')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping forecast')).toBeInTheDocument();
    expect(screen.getByText('2 actions')).toBeInTheDocument();
    expect(screen.getByText('1 open tasks plus 1 arrival checks')).toBeInTheDocument();
  });

  it('filters enterprise reporting by property focus while keeping portfolio rollups visible', async () => {
    vi.mocked(listVendorPmsRecords).mockImplementation(async (resource) => {
      if (resource === 'reservations') {
        return [
          {
            id: 'reservation-1',
            organization_id: 'org-1',
            property_id: 'goa-villa',
            room_id: 'room-1',
            guest_name: 'Aarav Mehta',
            guest_email: 'aarav@example.com',
            guest_phone: '9999999999',
            check_in_date: '2026-06-30',
            check_out_date: '2026-07-02',
            adults: 2,
            children: 0,
            status: 'reserved',
            payment_status: 'pending',
            total_amount: 12000,
            source: 'manual',
            notes: null,
            created_at: '2026-06-25T10:00:00.000Z',
          },
          {
            id: 'reservation-2',
            organization_id: 'org-1',
            property_id: 'manali-lodge',
            room_id: 'room-2',
            guest_name: 'Mira Sen',
            guest_email: 'mira@example.com',
            guest_phone: '8888888888',
            check_in_date: '2026-06-29',
            check_out_date: '2026-07-01',
            adults: 2,
            children: 1,
            status: 'checked_in',
            payment_status: 'paid',
            total_amount: 16000,
            source: 'manual',
            notes: null,
            created_at: '2026-06-24T10:00:00.000Z',
          },
        ] as never;
      }

      if (resource === 'folios') {
        return [
          {
            id: 'folio-1',
            organization_id: 'org-1',
            property_id: 'goa-villa',
            reservation_id: 'reservation-1',
            entry_type: 'room_charge',
            title: 'Goa room charge',
            amount: 12000,
            quantity: 1,
            payment_state: 'open',
            notes: null,
            posted_at: '2026-06-25T10:00:00.000Z',
            created_at: '2026-06-25T10:00:00.000Z',
          },
        ] as never;
      }

      return [] as never;
    });
    vi.mocked(listVendorAccountingRecords).mockResolvedValue([
      {
        id: 'payment-1',
        organization_id: 'org-1',
        reservation_id: 'reservation-2',
        folio_entry_id: null,
        manual_payment_intent_id: 'manual_1',
        payment_method: 'cash',
        amount: 16000,
        status: 'recorded',
        created_at: '2026-06-24T11:00:00.000Z',
      },
    ] as never);

    render(<AnalyticsWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(await screen.findByText('Multi-Property View')).toBeInTheDocument();
    expect(screen.getByText('Tracked properties')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);

    await userEvent.selectOptions(screen.getByLabelText('Analytics property focus'), 'goa-villa');

    expect(screen.getAllByText('Goa Villa').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manali Lodge').length).toBe(1);
    expect(screen.getAllByText('INR 12,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Aarav Mehta').length).toBeGreaterThan(0);
  });

  it('shows accommodation analytics guidance for dashboards and AI approvals', () => {
    render(<AnalyticsWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Operational dashboards')).toBeInTheDocument();
    expect(screen.getByText('AI forecasting')).toBeInTheDocument();
    expect(screen.getByText('AI recommendations')).toBeInTheDocument();
    expect(screen.getByText('Admin approval')).toBeInTheDocument();
  });
});
