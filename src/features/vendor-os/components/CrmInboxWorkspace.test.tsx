import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { CrmInboxWorkspace } from './CrmInboxWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  refresh: vi.fn(),
  recordsByModule: {} as Record<string, Record<string, unknown>[]>,
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

  it('shows accommodation guest-communication guidance in CRM and inbox', () => {
    const { rerender } = render(<CrmInboxWorkspace mode="crm" accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getByText('Automated confirmations')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();

    rerender(<CrmInboxWorkspace mode="inbox" accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Guest automation')).toBeInTheDocument();
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
  });
});
