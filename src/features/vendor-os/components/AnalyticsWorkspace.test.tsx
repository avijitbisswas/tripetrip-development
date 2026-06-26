import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsWorkspace } from './AnalyticsWorkspace';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';

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

  it('shows accommodation analytics guidance for dashboards and AI approvals', () => {
    render(<AnalyticsWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Operational dashboards')).toBeInTheDocument();
    expect(screen.getByText('AI forecasting')).toBeInTheDocument();
    expect(screen.getByText('AI recommendations')).toBeInTheDocument();
    expect(screen.getByText('Admin approval')).toBeInTheDocument();
  });
});
