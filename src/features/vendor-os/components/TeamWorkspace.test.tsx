import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { TeamWorkspace } from './TeamWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
}));

const accommodationAccess: ResolvedVendorAccommodationAccess = {
  vendorProfileId: 'vendor-1',
  businessType: 'hotel',
  providerFamily: 'accommodation',
  planTier: 'paid',
  enforcementMode: 'enforced',
  moduleOverrides: {},
  capabilityOverrides: {},
  approvalOverrides: {},
  updatedAt: '2026-06-25T10:00:00.000Z',
  isAccommodationProvider: true,
  visibleModules: ['dashboard', 'team', 'documents', 'subscriptions'],
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
    ai_assistant: true,
    marketplace: true,
    subscriptions: true,
    analytics: true,
    branches: true,
    documents: true,
    settings: true,
  },
  resolvedCapabilities: {
    'bookings.manual_entry': true,
    'bookings.online_engine': true,
    'bookings.group_bookings': true,
    'bookings.ai_chatbot': false,
    'inventory.manual_updates': true,
    'inventory.ota_sync': true,
    'inventory.rule_based_rates': true,
    'inventory.dynamic_pricing': false,
    'checkin.manual': true,
    'checkin.mobile': true,
    'checkin.digital_keys': true,
    'billing.manual_folios': true,
    'billing.gst_invoice': true,
    'billing.integrated_payments': true,
    'housekeeping.room_status': true,
    'housekeeping.mobile_tasks': true,
    'housekeeping.predictive_scheduling': false,
    'staff.manual_attendance': true,
    'staff.shift_scheduling': true,
    'staff.biometric_attendance': false,
    'analytics.occupancy_reports': true,
    'analytics.operational_dashboards': true,
    'analytics.ai_forecasting': false,
    'guest.manual_communication': true,
    'guest.automated_confirmations': true,
    'guest.whatsapp_automation': false,
  },
  resolvedApprovals: {
    pricing_changes: 'vendor_owner_only',
    marketplace_publishing: 'admin_approval_required',
    payout_actions: 'vendor_owner_only',
    refund_actions: 'vendor_owner_only',
    guest_automation: 'admin_approval_required',
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
    deleteRecord: vi.fn(),
    submitting: false,
    error: null,
  }),
}));

describe('TeamWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.updateRecord.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders team management sections and controls', () => {
    render(<TeamWorkspace />);

    expect(screen.getByText('Team Management')).toBeInTheDocument();
    expect(screen.getByText('Role Access')).toBeInTheDocument();
    expect(screen.getByText('Branch Staffing')).toBeInTheDocument();
    expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
    expect(screen.getByText('Audit Accountability')).toBeInTheDocument();
    expect(screen.getByText('Neha Kapoor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeInTheDocument();
  });

  it('creates a team invitation through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'member-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<TeamWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Email *'), 'ops@example.com');
    await userEvent.selectOptions(screen.getByLabelText('Role *'), 'manager');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'invited');
    await userEvent.type(screen.getByLabelText('Display name'), 'Ops Manager');
    await userEvent.click(screen.getByRole('button', { name: 'Invite Member' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      invited_email: 'ops@example.com',
      role: 'manager',
      status: 'invited',
      display_name: 'Ops Manager',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live team records when available', () => {
    hookMocks.records = [
      {
        id: 'member-1',
        organization_id: 'org-1',
        invited_email: 'ops@example.com',
        display_name: 'Ops Manager',
        role: 'manager',
        status: 'invited',
      },
    ];

    render(<TeamWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Ops Manager')).toBeInTheDocument();
    expect(screen.getByText('ops@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('Manager').length).toBeGreaterThan(0);
  });

  it('updates a live member role and status through access review controls', async () => {
    hookMocks.records = [
      {
        id: 'member-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        invited_email: 'ops@example.com',
        display_name: 'Ops Manager',
        role: 'manager',
        status: 'invited',
      },
    ];
    hookMocks.updateRecord.mockResolvedValueOnce({ id: 'member-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<TeamWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.selectOptions(screen.getByLabelText('Review member *'), 'member-1');
    await userEvent.selectOptions(screen.getByLabelText('Reviewed role *'), 'operations');
    await userEvent.selectOptions(screen.getByLabelText('Reviewed status *'), 'active');
    await userEvent.type(screen.getByLabelText('Access review note'), 'Approved for Manali operations coverage');
    await userEvent.click(screen.getByRole('button', { name: 'Save Access Review' }));

    expect(hookMocks.updateRecord).toHaveBeenCalledWith('member-1', {
      role: 'operations',
      status: 'active',
      is_active: true,
      title: 'Approved for Manali operations coverage',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('shows accommodation staffing guidance for attendance and approval workflows', () => {
    render(<TeamWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Shift scheduling')).toBeInTheDocument();
    expect(screen.getByText('Biometric attendance')).toBeInTheDocument();
    expect(screen.getByText('Approval changes')).toBeInTheDocument();
    expect(screen.getByText('Owner approval')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });
});
