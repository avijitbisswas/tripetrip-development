import { describe, expect, it, vi, beforeEach } from 'vitest';
import { supabase } from '@/src/lib/supabase';
import {
  createVendorDocumentRecord,
  createVendorOSRecord,
  deleteVendorOSRecord,
  markVendorNotificationRead,
  subscribeVendorNotifications,
  uploadVendorDocumentFile,
  VENDOR_DOCUMENTS_BUCKET,
  updateVendorOSRecord,
  type VendorOSRecordRow,
} from './api';
import type { VendorOSOperation } from './operations';

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
    storage: {
      from: vi.fn(),
    },
    auth: {
      getUser: vi.fn(),
    },
  },
}));

const operation: VendorOSOperation = {
  module: 'crm',
  table: 'vendor_leads',
  titleField: 'title',
  statusField: 'stage',
  valueField: 'estimated_value',
  dateField: 'created_at',
  createFields: [],
};

describe('Vendor OS record API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.channel).mockReset();
    vi.mocked(supabase.removeChannel).mockReset();
    vi.mocked(supabase.storage.from).mockReset();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as never);
  });

  it('updates a module record in its mapped table', async () => {
    const row: VendorOSRecordRow = {
      id: 'lead-1',
      organization_id: 'org-1',
      title: 'Goa group trip',
      stage: 'won',
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const auditSingle = vi.fn().mockResolvedValue({ data: { id: 'audit-1' }, error: null });
    const auditSelect = vi.fn(() => ({ single: auditSingle }));
    const auditInsert = vi.fn(() => ({ select: auditSelect }));

    vi.mocked(supabase.from)
      .mockReturnValueOnce({ update } as never)
      .mockReturnValueOnce({ insert: auditInsert } as never);

    await expect(updateVendorOSRecord(operation, 'lead-1', { stage: 'won' })).resolves.toEqual(row);
    expect(supabase.from).toHaveBeenCalledWith('vendor_leads');
    expect(update).toHaveBeenCalledWith({ stage: 'won' });
    expect(eq).toHaveBeenCalledWith('id', 'lead-1');
    expect(supabase.from).toHaveBeenCalledWith('vendor_audit_logs');
    expect(auditInsert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      branch_id: null,
      actor_user_id: 'user-1',
      module: 'crm',
      action: 'crm.updated',
      entity_type: 'vendor_leads',
      entity_id: 'lead-1',
      severity: 'info',
      metadata: {
        changed_fields: ['stage'],
        table: 'vendor_leads',
        title_field: 'title',
      },
    });
  });

  it('deletes a module record in its mapped table', async () => {
    const row: VendorOSRecordRow = {
      id: 'lead-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      title: 'Goa group trip',
      stage: 'lost',
    };
    const deleteSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const deleteSelect = vi.fn(() => ({ single: deleteSingle }));
    const eq = vi.fn(() => ({ select: deleteSelect }));
    const deleteRecord = vi.fn(() => ({ eq }));
    const auditSingle = vi.fn().mockResolvedValue({ data: { id: 'audit-1' }, error: null });
    const auditSelect = vi.fn(() => ({ single: auditSingle }));
    const auditInsert = vi.fn(() => ({ select: auditSelect }));

    vi.mocked(supabase.from)
      .mockReturnValueOnce({ delete: deleteRecord } as never)
      .mockReturnValueOnce({ insert: auditInsert } as never);

    await expect(deleteVendorOSRecord(operation, 'lead-1')).resolves.toEqual({ id: 'lead-1' });
    expect(supabase.from).toHaveBeenCalledWith('vendor_leads');
    expect(deleteRecord).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'lead-1');
    expect(auditInsert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      branch_id: 'branch-1',
      actor_user_id: 'user-1',
      module: 'crm',
      action: 'crm.deleted',
      entity_type: 'vendor_leads',
      entity_id: 'lead-1',
      severity: 'info',
      metadata: {
        table: 'vendor_leads',
        title_field: 'title',
      },
    });
  });

  it('does not send branch_id for organization-scoped records', async () => {
    const branchOperation: VendorOSOperation = {
      ...operation,
      module: 'branches',
      table: 'vendor_branches',
      titleField: 'name',
      statusField: 'is_active',
      branchScoped: false,
    };
    const row: VendorOSRecordRow = {
      id: 'branch-2',
      organization_id: 'org-1',
      name: 'Goa Office',
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const auditSingle = vi.fn().mockResolvedValue({ data: { id: 'audit-1' }, error: null });
    const auditSelect = vi.fn(() => ({ single: auditSingle }));
    const auditInsert = vi.fn(() => ({ select: auditSelect }));

    vi.mocked(supabase.from)
      .mockReturnValueOnce({ insert } as never)
      .mockReturnValueOnce({ insert: auditInsert } as never);

    await expect(createVendorOSRecord(branchOperation, 'org-1', 'branch-1', { name: 'Goa Office' })).resolves.toEqual(row);
    expect(insert).toHaveBeenCalledWith({ organization_id: 'org-1', name: 'Goa Office' });
    expect(auditInsert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      branch_id: null,
      actor_user_id: 'user-1',
      module: 'branches',
      action: 'branches.created',
      entity_type: 'vendor_branches',
      entity_id: 'branch-2',
      severity: 'info',
      metadata: {
        fields: ['name'],
        table: 'vendor_branches',
        title_field: 'name',
      },
    });
  });

  it('adds the authenticated uploader when creating document records', async () => {
    const row = {
      id: 'doc-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      uploaded_by: 'user-1',
      module: 'documents',
      name: 'Hotel Trade License',
      document_type: 'license',
      storage_path: 'vendors/org-1/licenses/hotel-trade-license.pdf',
      status: 'active',
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    vi.mocked(supabase.from).mockReturnValueOnce({ insert } as never);

    await expect(
      createVendorDocumentRecord({
        organization_id: 'org-1',
        branch_id: 'branch-1',
        module: 'documents',
        name: 'Hotel Trade License',
        document_type: 'license',
        storage_path: 'vendors/org-1/licenses/hotel-trade-license.pdf',
        status: 'active',
      }),
    ).resolves.toEqual(row);

    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      branch_id: 'branch-1',
      module: 'documents',
      name: 'Hotel Trade License',
      document_type: 'license',
      storage_path: 'vendors/org-1/licenses/hotel-trade-license.pdf',
      status: 'active',
      uploaded_by: 'user-1',
    });
  });

  it('adds document module and uploader fields for generic document creates', async () => {
    const documentOperation: VendorOSOperation = {
      module: 'documents',
      table: 'vendor_documents',
      titleField: 'name',
      statusField: 'status',
      createFields: [],
    };
    const row: VendorOSRecordRow = {
      id: 'doc-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      uploaded_by: 'user-1',
      module: 'documents',
      name: 'Insurance Policy',
      status: 'active',
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const auditSingle = vi.fn().mockResolvedValue({ data: { id: 'audit-1' }, error: null });
    const auditSelect = vi.fn(() => ({ single: auditSingle }));
    const auditInsert = vi.fn(() => ({ select: auditSelect }));

    vi.mocked(supabase.from)
      .mockReturnValueOnce({ insert } as never)
      .mockReturnValueOnce({ insert: auditInsert } as never);

    await expect(
      createVendorOSRecord(documentOperation, 'org-1', 'branch-1', {
        name: 'Insurance Policy',
        document_type: 'insurance',
        storage_path: 'vendors/org-1/insurance/policy.pdf',
        status: 'active',
      }),
    ).resolves.toEqual(row);

    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      branch_id: 'branch-1',
      module: 'documents',
      uploaded_by: 'user-1',
      name: 'Insurance Policy',
      document_type: 'insurance',
      storage_path: 'vendors/org-1/insurance/policy.pdf',
      status: 'active',
    });
  });

  it('uploads a vendor document file to storage and creates its document record', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(123456);
    const file = new File(['license'], 'Hotel Trade License.pdf', { type: 'application/pdf' });
    const upload = vi.fn().mockResolvedValue({
      data: { path: 'organizations/org-1/branches/branch-1/license/123456-hotel-trade-license.pdf' },
      error: null,
    });
    const row = {
      id: 'doc-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      uploaded_by: 'user-1',
      module: 'documents',
      name: 'Hotel Trade License',
      document_type: 'license',
      storage_path: 'organizations/org-1/branches/branch-1/license/123456-hotel-trade-license.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: file.size,
      status: 'active',
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    vi.mocked(supabase.storage.from).mockReturnValue({ upload } as never);
    vi.mocked(supabase.from).mockReturnValueOnce({ insert } as never);

    await expect(
      uploadVendorDocumentFile({
        organizationId: 'org-1',
        branchId: 'branch-1',
        module: 'documents',
        name: 'Hotel Trade License',
        documentType: 'license',
        status: 'active',
        file,
      }),
    ).resolves.toEqual(row);

    expect(supabase.storage.from).toHaveBeenCalledWith(VENDOR_DOCUMENTS_BUCKET);
    expect(upload).toHaveBeenCalledWith(
      'organizations/org-1/branches/branch-1/license/123456-hotel-trade-license.pdf',
      file,
      { contentType: 'application/pdf', upsert: false },
    );
    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      branch_id: 'branch-1',
      uploaded_by: 'user-1',
      module: 'documents',
      entity_type: null,
      entity_id: null,
      name: 'Hotel Trade License',
      document_type: 'license',
      storage_path: 'organizations/org-1/branches/branch-1/license/123456-hotel-trade-license.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: file.size,
      status: 'active',
      metadata: {},
    });
  });

  it('skips audit writes when no authenticated user is available', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: null },
      error: null,
    } as never);
    const row: VendorOSRecordRow = {
      id: 'lead-1',
      organization_id: 'org-1',
      title: 'Goa group trip',
      stage: 'won',
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));

    vi.mocked(supabase.from).mockReturnValueOnce({ update } as never);

    await expect(updateVendorOSRecord(operation, 'lead-1', { stage: 'won' })).resolves.toEqual(row);
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it('marks a notification as read in Supabase', async () => {
    const notification = {
      id: 'note-1',
      organization_id: 'org-1',
      recipient_user_id: 'user-1',
      module: 'calendar',
      title: 'New booking',
      status: 'read',
      created_at: '2026-06-03T00:00:00.000Z',
    };
    const single = vi.fn().mockResolvedValue({ data: notification, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));

    vi.mocked(supabase.from).mockReturnValueOnce({ update } as never);

    await expect(markVendorNotificationRead('note-1')).resolves.toEqual(notification);
    expect(supabase.from).toHaveBeenCalledWith('vendor_notifications');
    expect(update).toHaveBeenCalledWith({
      status: 'read',
      read_at: expect.any(String),
    });
    expect(eq).toHaveBeenCalledWith('id', 'note-1');
  });

  it('subscribes to realtime notification changes for a user and cleans up the channel', () => {
    const onChange = vi.fn();
    const subscribe = vi.fn();
    const on = vi.fn(() => ({ subscribe }));
    const channel = { on, subscribe };

    vi.mocked(supabase.channel).mockReturnValue(channel as never);

    const unsubscribe = subscribeVendorNotifications('user-1', onChange);

    expect(supabase.channel).toHaveBeenCalledWith('vendor-notifications:user-1');
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendor_notifications',
        filter: 'recipient_user_id=eq.user-1',
      },
      onChange,
    );
    expect(subscribe).toHaveBeenCalled();

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
