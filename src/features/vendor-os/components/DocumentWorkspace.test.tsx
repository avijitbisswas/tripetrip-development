import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentWorkspace } from './DocumentWorkspace';

const hookMocks = vi.hoisted(() => ({
  createRecord: vi.fn(),
  uploadDocument: vi.fn(),
  createDownloadUrl: vi.fn(),
  refresh: vi.fn(),
  records: [] as Record<string, unknown>[],
}));

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
});
