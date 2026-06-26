import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedVendorAccommodationAccess } from '../accommodationAccess';
import { DocumentWorkspace } from './DocumentWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  uploadDocument: vi.fn(),
  createDownloadUrl: vi.fn(),
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
  useVendorDocumentUpload: () => ({
    uploadDocument: hookMocks.uploadDocument,
    submitting: false,
    error: null,
  }),
  useVendorDocumentDownload: () => ({
    createDownloadUrl: hookMocks.createDownloadUrl,
    submitting: false,
    error: null,
  }),
}));

describe('DocumentWorkspace', () => {
  beforeEach(() => {
    hookMocks.createRecord.mockReset();
    hookMocks.updateRecord.mockReset();
    hookMocks.uploadDocument.mockReset();
    hookMocks.createDownloadUrl.mockReset();
    hookMocks.refresh.mockReset();
    hookMocks.records = [];
  });

  it('renders document management sections and controls', () => {
    render(<DocumentWorkspace />);

    expect(screen.getByText('Document Management')).toBeInTheDocument();
    expect(screen.getByText('Compliance Vault')).toBeInTheDocument();
    expect(screen.getByText('Expiry Alerts')).toBeInTheDocument();
    expect(screen.getAllByText('Booking Docs').length).toBeGreaterThan(0);
    expect(screen.getByText('Storage Governance')).toBeInTheDocument();
    expect(screen.getByText('Hotel Trade License')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Document' })).toBeInTheDocument();
  });

  it('creates a document through the workspace form', async () => {
    hookMocks.createRecord.mockResolvedValueOnce({ id: 'doc-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<DocumentWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Document name *'), 'Hotel Trade License');
    await userEvent.type(screen.getByLabelText('Document type *'), 'license');
    await userEvent.type(screen.getByLabelText('Storage path *'), 'vendors/org-1/licenses/hotel-trade-license.pdf');
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'active');
    await userEvent.click(screen.getByRole('button', { name: 'Create Document' }));

    expect(hookMocks.createRecord).toHaveBeenCalledWith({
      module: 'documents',
      name: 'Hotel Trade License',
      document_type: 'license',
      storage_path: 'vendors/org-1/licenses/hotel-trade-license.pdf',
      status: 'active',
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('uploads a selected file through the workspace form', async () => {
    hookMocks.uploadDocument.mockResolvedValueOnce({ id: 'doc-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);
    const file = new File(['license'], 'hotel-trade-license.pdf', { type: 'application/pdf' });

    render(<DocumentWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.type(screen.getByLabelText('Document name *'), 'Hotel Trade License');
    await userEvent.type(screen.getByLabelText('Document type *'), 'license');
    await userEvent.upload(screen.getByLabelText('File upload'), file);
    await userEvent.selectOptions(screen.getByLabelText('Status *'), 'active');
    await userEvent.click(screen.getByRole('button', { name: 'Create Document' }));

    expect(hookMocks.uploadDocument).toHaveBeenCalledWith({
      name: 'Hotel Trade License',
      document_type: 'license',
      status: 'active',
      file,
    });
    expect(hookMocks.createRecord).not.toHaveBeenCalled();
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('renders live document records when available', () => {
    hookMocks.records = [
      {
        id: 'doc-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        name: 'Rafting Safety Permit',
        document_type: 'permit',
        storage_path: 'organizations/org-1/permits/rafting-safety.pdf',
        status: 'active',
        expires_at: '2026-09-30',
      },
    ];

    render(<DocumentWorkspace organizationId="org-1" branchId="branch-1" />);

    expect(screen.getByText('Rafting Safety Permit')).toBeInTheDocument();
    expect(screen.getByText('Permit')).toBeInTheDocument();
    expect(screen.getByText('Expires 2026-09-30')).toBeInTheDocument();
  });

  it('opens a signed download URL for live document records', async () => {
    hookMocks.records = [
      {
        id: 'doc-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        name: 'Hotel Trade License',
        document_type: 'license',
        storage_path: 'organizations/org-1/licenses/hotel-trade-license.pdf',
        status: 'active',
      },
    ];
    hookMocks.createDownloadUrl.mockResolvedValueOnce('https://storage.example.com/signed-license.pdf');
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<DocumentWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Download Hotel Trade License' }));

    expect(hookMocks.createDownloadUrl).toHaveBeenCalledWith('organizations/org-1/licenses/hotel-trade-license.pdf');
    expect(open).toHaveBeenCalledWith('https://storage.example.com/signed-license.pdf', '_blank', 'noopener,noreferrer');
  });

  it('reviews a live document and stores approval metadata', async () => {
    hookMocks.records = [
      {
        id: 'doc-1',
        organization_id: 'org-1',
        branch_id: 'branch-1',
        name: 'Goa Villa Insurance',
        document_type: 'insurance',
        storage_path: 'organizations/org-1/insurance/goa-villa.pdf',
        status: 'draft',
      },
    ];
    hookMocks.updateRecord.mockResolvedValueOnce({ id: 'doc-1' });
    hookMocks.refresh.mockResolvedValueOnce(undefined);

    render(<DocumentWorkspace organizationId="org-1" branchId="branch-1" />);

    await userEvent.selectOptions(screen.getByLabelText('Review document *'), 'doc-1');
    await userEvent.selectOptions(screen.getByLabelText('Review decision *'), 'active');
    await userEvent.type(screen.getByLabelText('Review note'), 'Insurance verified for 2026 season');
    await userEvent.click(screen.getByRole('button', { name: 'Save Document Review' }));

    expect(hookMocks.updateRecord).toHaveBeenCalledWith('doc-1', {
      status: 'active',
      metadata: {
        review_note: 'Insurance verified for 2026 season',
        review_decision: 'active',
        source: 'document_workspace',
      },
    });
    expect(hookMocks.refresh).toHaveBeenCalled();
  });

  it('shows accommodation compliance guidance for documents and automation readiness', () => {
    render(<DocumentWorkspace accommodationAccess={accommodationAccess} />);

    expect(screen.getByText('Accommodation controls')).toBeInTheDocument();
    expect(screen.getAllByText('Expiry automation').length).toBeGreaterThan(0);
    expect(screen.getByText('WhatsApp automation')).toBeInTheDocument();
    expect(screen.getByText('Advanced only')).toBeInTheDocument();
    expect(screen.getByText('Document approvals')).toBeInTheDocument();
    expect(screen.getByText('Admin approval')).toBeInTheDocument();
  });
});
