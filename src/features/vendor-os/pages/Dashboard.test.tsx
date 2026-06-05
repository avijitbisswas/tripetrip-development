import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';

const createRecord = vi.fn();
const updateRecord = vi.fn();
const deleteRecord = vi.fn();
const refreshRecords = vi.fn();
const uploadDocument = vi.fn();

vi.mock('../hooks', () => ({
  useVendorOSTenant: () => ({
    selectedOrganization: { id: 'org-1', name: 'Himalayan Escape Group' },
    branches: [{ id: 'branch-1', name: 'Manali Hotel' }],
    activeBranch: { id: 'branch-1', name: 'Manali Hotel' },
    role: 'staff',
    can: (module: string, action = 'view') => {
      if (module === 'accounting' || module === 'subscriptions') return false;
      return action === 'view' || action === 'update';
    },
    loading: false,
    error: null,
  }),
  useVendorOSNotifications: () => ({
    notifications: [{ id: 'note-1', title: 'New booking', status: 'unread', created_at: '2026-06-03T00:00:00.000Z' }],
    unreadCount: 1,
    loading: false,
  }),
  useVendorOSAuditLogs: () => [
    {
      id: 'audit-1',
      module: 'calendar',
      action: 'booking.created',
      severity: 'info',
      created_at: '2026-06-03T00:00:00.000Z',
    },
  ],
  useVendorOSDocuments: () => [
    {
      id: 'doc-1',
      name: 'Hotel Trade License',
      document_type: 'license',
      status: 'active',
      created_at: '2026-06-03T00:00:00.000Z',
    },
  ],
  useVendorOSRecords: () => ({
    records: [],
    loading: false,
    error: null,
    refresh: refreshRecords,
  }),
  useVendorOSRecordMutations: () => ({
    createRecord,
    updateRecord,
    deleteRecord,
    submitting: false,
    error: null,
  }),
  useVendorDocumentUpload: () => ({
    uploadDocument,
    submitting: false,
    error: null,
  }),
}));

describe('Vendor OS dashboard', () => {
  beforeEach(() => {
    createRecord.mockReset();
    updateRecord.mockReset();
    deleteRecord.mockReset();
    refreshRecords.mockReset();
    uploadDocument.mockReset();
  });

  it('renders the operating system shell and staff-safe modules', () => {
    render(
      <MemoryRouter>
        <Dashboard initialUserId="user-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Tripetrip Vendor OS')).toBeInTheDocument();
    expect(screen.getByText('Himalayan Escape Group')).toBeInTheDocument();
    expect(screen.getByText('Unread')).toBeInTheDocument();
    expect(screen.getAllByText('Calendar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PMS').length).toBeGreaterThan(0);
    expect(screen.queryByText('Accounting')).not.toBeInTheDocument();
    expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument();
    expect(screen.getByText('Hotel Trade License')).toBeInTheDocument();
  });

  it('renders the Team module as a team management workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/team']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Team Management')).toBeInTheDocument();
    expect(screen.getByText('Role Access')).toBeInTheDocument();
    expect(screen.getByText('Branch Staffing')).toBeInTheDocument();
    expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
    expect(screen.getByText('Audit Accountability')).toBeInTheDocument();
    expect(screen.getByText('Neha Kapoor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeInTheDocument();
    expect(screen.getByText('Backed by vendor_team_members')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
  });

  it('renders the Branches module as a multi-branch workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/branches']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Multi-branch Support')).toBeInTheDocument();
    expect(screen.getByText('Branch Registry')).toBeInTheDocument();
    expect(screen.getByText('Category Mix')).toBeInTheDocument();
    expect(screen.getByText('Local Controls')).toBeInTheDocument();
    expect(screen.getByText('Operating Policies')).toBeInTheDocument();
    expect(screen.getByText('Backed by vendor_branches')).toBeInTheDocument();
    expect(screen.getByLabelText('Branch name *')).toBeInTheDocument();
  });

  it('creates a branch through the live workspace form', async () => {
    createRecord.mockResolvedValueOnce({ id: 'branch-1' });
    refreshRecords.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={['/vendor/os/branches']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Branch name *'), 'Jaipur DMC Desk');
    await userEvent.type(screen.getByLabelText('City'), 'Jaipur');
    await userEvent.type(screen.getByLabelText('Country'), 'India');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'active');
    await userEvent.click(screen.getByRole('button', { name: 'Create Branch' }));

    expect(createRecord).toHaveBeenCalledWith({
      name: 'Jaipur DMC Desk',
      city: 'Jaipur',
      country: 'India',
      is_active: true,
    });
    expect(refreshRecords).toHaveBeenCalled();
  });

  it('renders the Documents module as a document management workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/documents']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Document Management')).toBeInTheDocument();
    expect(screen.getByText('Compliance Vault')).toBeInTheDocument();
    expect(screen.getByText('Expiry Alerts')).toBeInTheDocument();
    expect(screen.getAllByText('Booking Docs').length).toBeGreaterThan(0);
    expect(screen.getByText('Storage Governance')).toBeInTheDocument();
    expect(screen.getByText('Backed by vendor_documents')).toBeInTheDocument();
    expect(screen.getByLabelText('Document name *')).toBeInTheDocument();
  });

  it('creates a document through the live workspace form', async () => {
    createRecord.mockResolvedValueOnce({ id: 'doc-1' });
    refreshRecords.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={['/vendor/os/documents']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Document name *'), 'Hotel Trade License');
    await userEvent.type(screen.getByLabelText('Document type *'), 'license');
    await userEvent.type(screen.getByLabelText('Storage path *'), 'vendors/org-1/licenses/hotel-trade-license.pdf');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'active');
    await userEvent.click(screen.getByRole('button', { name: 'Create Document' }));

    expect(createRecord).toHaveBeenCalledWith({
      module: 'documents',
      name: 'Hotel Trade License',
      document_type: 'license',
      storage_path: 'vendors/org-1/licenses/hotel-trade-license.pdf',
      status: 'active',
    });
    expect(refreshRecords).toHaveBeenCalled();
  });

  it('renders the Settings module as module controls workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/settings']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    expect(screen.getByText('Business Profile')).toBeInTheDocument();
    expect(screen.getByText('Module Controls')).toBeInTheDocument();
    expect(screen.getAllByText('Integrations').length).toBeGreaterThan(0);
    expect(screen.getByText('Policy Center')).toBeInTheDocument();
    expect(screen.getByText('Backed by vendor_os_module_settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Module *')).toBeInTheDocument();
  });

  it('creates a module setting through the live workspace form', async () => {
    createRecord.mockResolvedValueOnce({ id: 'setting-1' });
    refreshRecords.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={['/vendor/os/settings']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.selectOptions(screen.getByLabelText('Module *'), 'marketplace');
    await userEvent.selectOptions(screen.getByLabelText('Enabled *'), 'false');
    await userEvent.type(screen.getByLabelText('Policy note'), 'Pause public sync during audit');
    await userEvent.click(screen.getByRole('button', { name: 'Save Setting' }));

    expect(createRecord).toHaveBeenCalledWith({
      module: 'marketplace',
      is_enabled: false,
      settings: { policy_note: 'Pause public sync during audit' },
    });
    expect(refreshRecords).toHaveBeenCalled();
  });

  it('creates a team invitation through the live workspace form', async () => {
    createRecord.mockResolvedValueOnce({ id: 'member-1' });
    refreshRecords.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={['/vendor/os/team']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Email *'), 'ops@example.com');
    await userEvent.selectOptions(screen.getByLabelText('Role *'), 'manager');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'invited');
    await userEvent.type(screen.getByLabelText('Display name'), 'Ops Manager');
    await userEvent.click(screen.getByRole('button', { name: 'Invite Member' }));

    expect(createRecord).toHaveBeenCalledWith({
      invited_email: 'ops@example.com',
      role: 'manager',
      status: 'invited',
      display_name: 'Ops Manager',
    });
    expect(refreshRecords).toHaveBeenCalled();
  });

  it('renders the Tours module as a departure workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/tours']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Tour Operator System')).toBeInTheDocument();
    expect(screen.getByText('Departure Control')).toBeInTheDocument();
    expect(screen.getByText('Guide Roster')).toBeInTheDocument();
    expect(screen.getByText('Group Manifest')).toBeInTheDocument();
  });

  it('renders the Activities module as a safety and slots workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/activities']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Activity Management System')).toBeInTheDocument();
    expect(screen.getByText('Slot Control')).toBeInTheDocument();
    expect(screen.getByText('Safety Desk')).toBeInTheDocument();
    expect(screen.getByText('Equipment Readiness')).toBeInTheDocument();
  });

  it('renders the Fleet module as a dispatch workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/fleet']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Fleet Management System')).toBeInTheDocument();
    expect(screen.getByText('Dispatch Command')).toBeInTheDocument();
    expect(screen.getByText('Driver Duty Board')).toBeInTheDocument();
    expect(screen.getByText('Maintenance & Fuel')).toBeInTheDocument();
    expect(screen.getByText('Permit Compliance')).toBeInTheDocument();
  });

  it('renders the Accounting module as a finance workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/accounting']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Accounting')).toBeInTheDocument();
    expect(screen.getByText('Receivables Command')).toBeInTheDocument();
    expect(screen.getByText('Expense Desk')).toBeInTheDocument();
    expect(screen.getByText('Payouts & Commissions')).toBeInTheDocument();
    expect(screen.getByText('Tax & Ledger')).toBeInTheDocument();
  });

  it('renders the Marketplace module as a listing operations workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/marketplace']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Marketplace Listing Management')).toBeInTheDocument();
    expect(screen.getByText('Listing Sync Command')).toBeInTheDocument();
    expect(screen.getByText('Direct Deals Desk')).toBeInTheDocument();
    expect(screen.getByText('Inventory Mapping')).toBeInTheDocument();
    expect(screen.getByText('Conversion Health')).toBeInTheDocument();
  });

  it('renders the AI Assistant module as an operations intelligence workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/ai-assistant']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('AI Operations Assistant')).toBeInTheDocument();
    expect(screen.getByText('Daily Brief')).toBeInTheDocument();
    expect(screen.getAllByText('Risk Alerts')).toHaveLength(2);
    expect(screen.getByText('Reply Drafts')).toBeInTheDocument();
    expect(screen.getByText('Pricing Suggestions')).toBeInTheDocument();
  });

  it('renders the Subscriptions module as a plan and usage workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/subscriptions']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Subscription Management')).toBeInTheDocument();
    expect(screen.getByText('Plan Control')).toBeInTheDocument();
    expect(screen.getByText('Usage Metering')).toBeInTheDocument();
    expect(screen.getByText('Add-ons & Limits')).toBeInTheDocument();
    expect(screen.getByText('Branch Entitlements')).toBeInTheDocument();
  });

  it('renders the Analytics module as a reporting workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/analytics']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Analytics & Reporting')).toBeInTheDocument();
    expect(screen.getByText('Executive Reports')).toBeInTheDocument();
    expect(screen.getByText('Branch Comparison')).toBeInTheDocument();
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
    expect(screen.getByText('Export Center')).toBeInTheDocument();
  });

  it('renders the PMS module as a front desk workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/pms']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Front Desk Command')).toBeInTheDocument();
    expect(screen.getByText('Room Grid')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping Board')).toBeInTheDocument();
  });

  it('renders the CRM module as a deep workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/crm']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('CRM Command Center')).toBeInTheDocument();
    expect(screen.getAllByText('Quote Sent').length).toBeGreaterThan(0);
    expect(screen.getByText('Aarav Mehta')).toBeInTheDocument();
  });

  it('renders the Calendar module as a live inventory workspace', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/os/calendar']}>
        <Routes>
          <Route path="/vendor/os/:module" element={<Dashboard initialUserId="user-1" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Calendar + Live Inventory')).toBeInTheDocument();
    expect(screen.getByText('Unified Availability Board')).toBeInTheDocument();
    expect(screen.getByText('PMS Rooms')).toBeInTheDocument();
  });
});
