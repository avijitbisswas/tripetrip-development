import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { SettingsWorkspace } from './SettingsWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
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
    marketplace: true,
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

  it('shows accommodation settings guidance for publishing and pricing rules', () => {
    render(<SettingsWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Pricing changes')).toBeInTheDocument();
    expect(screen.getByText('Owner approval')).toBeInTheDocument();
    expect(screen.getByText('Publishing policy')).toBeInTheDocument();
    expect(screen.getByText('Admin approval')).toBeInTheDocument();
  });
});
