import { describe, expect, it, vi, beforeEach } from 'vitest';
import { supabase } from '@/src/lib/supabase';
import {
  createVendorDocumentRecord,
  createVendorDocumentSignedUrl,
  createVendorOSRecord,
  deleteVendorOSRecord,
  markVendorNotificationRead,
  subscribeVendorOSRecords,
  subscribeVendorNotifications,
  uploadVendorDocumentFile,
  upsertVendorTeamMember,
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
      getSession: vi.fn(),
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
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: 'vendor-token' } },
      error: null,
    } as never);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ allowed: true }), { status: 200 })),
    );
  });

  it('rejects record creation when worker-side mutation authorization blocks the module', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'This module is not enabled for this vendor account.' }), { status: 403 })),
    );

    await expect(createVendorOSRecord(operation, 'org-1', 'branch-1', { title: 'Goa group trip' })).rejects.toThrow(
      'This module is not enabled for this vendor account.',
    );

    expect(fetch).toHaveBeenCalledWith('/api/vendor-os/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'crm',
        organizationId: 'org-1',
        branchId: 'branch-1',
        payload: {
          title: 'Goa group trip',
        },
      }),
    });
    expect(supabase.from).not.toHaveBeenCalledWith('vendor_leads');
  });

  it('rejects document upload when worker-side mutation authorization blocks uploads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'This module is not enabled for this vendor account.' }), { status: 403 })),
    );
    const file = new File(['license'], 'Hotel Trade License.pdf', { type: 'application/pdf' });

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
    ).rejects.toThrow('This module is not enabled for this vendor account.');

    expect(fetch).toHaveBeenCalledWith('/api/vendor-os/mutations/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'documents',
        action: 'upload',
        organizationId: 'org-1',
      }),
    });
    expect(supabase.storage.from).not.toHaveBeenCalled();
  });

  it('updates a module record in its mapped table', async () => {
    const row: VendorOSRecordRow = {
      id: 'lead-1',
      organization_id: 'org-1',
      title: 'Goa group trip',
      stage: 'won',
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ record: row }), { status: 200 }),
    );

    await expect(updateVendorOSRecord(operation, 'org-1', 'lead-1', { stage: 'won' })).resolves.toEqual(row);
    expect(fetch).toHaveBeenCalledWith('/api/vendor-os/records', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'crm',
        organizationId: 'org-1',
        recordId: 'lead-1',
        input: { stage: 'won' },
      }),
    });
  });

  it('deletes a module record in its mapped table', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'lead-1' }), { status: 200 }),
    );

    await expect(deleteVendorOSRecord(operation, 'org-1', 'lead-1')).resolves.toEqual({ id: 'lead-1' });
    expect(fetch).toHaveBeenCalledWith('/api/vendor-os/records', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'crm',
        organizationId: 'org-1',
        recordId: 'lead-1',
      }),
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
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ record: row }), { status: 200 }),
    );

    await expect(createVendorOSRecord(branchOperation, 'org-1', 'branch-1', { name: 'Goa Office' })).resolves.toEqual(row);
    expect(fetch).toHaveBeenCalledWith('/api/vendor-os/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'branches',
        organizationId: 'org-1',
        branchId: null,
        payload: { name: 'Goa Office' },
      }),
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
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ record: row }), { status: 200 }),
    );

    await expect(
      createVendorOSRecord(documentOperation, 'org-1', 'branch-1', {
        name: 'Insurance Policy',
        document_type: 'insurance',
        storage_path: 'vendors/org-1/insurance/policy.pdf',
        status: 'active',
      }),
    ).resolves.toEqual(row);

    expect(fetch).toHaveBeenCalledWith('/api/vendor-os/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'documents',
        organizationId: 'org-1',
        branchId: 'branch-1',
        payload: {
          module: 'documents',
          uploaded_by: 'user-1',
          name: 'Insurance Policy',
          document_type: 'insurance',
          storage_path: 'vendors/org-1/insurance/policy.pdf',
          status: 'active',
        },
      }),
    });
  });

  it('creates team invitations with inviter, display name, status, and branch scope', async () => {
    const row = {
      id: 'member-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      invited_by: 'user-1',
      invited_email: 'ops@example.com',
      display_name: 'Ops Manager',
      role: 'manager',
      status: 'invited',
      is_active: true,
    };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));

    vi.mocked(supabase.from).mockReturnValueOnce({ insert } as never);

    await expect(
      upsertVendorTeamMember({
        organization_id: 'org-1',
        branch_id: 'branch-1',
        invited_email: 'ops@example.com',
        display_name: 'Ops Manager',
        role: 'manager',
        status: 'invited',
      }),
    ).resolves.toEqual(row);

    expect(insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      branch_id: 'branch-1',
      invited_by: 'user-1',
      invited_email: 'ops@example.com',
      display_name: 'Ops Manager',
      role: 'manager',
      status: 'invited',
      is_active: true,
      accepted_at: null,
    });
  });

  it('adds inviter and normalized invitation state for generic team creates', async () => {
    const teamOperation: VendorOSOperation = {
      module: 'team',
      table: 'vendor_team_members',
      titleField: 'title',
      statusField: 'role',
      createFields: [],
    };
    const row: VendorOSRecordRow = {
      id: 'member-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      invited_by: 'user-1',
      invited_email: 'ops@example.com',
      display_name: 'Ops Manager',
      role: 'manager',
      status: 'invited',
      is_active: true,
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ record: row }), { status: 200 }),
    );

    await expect(
      createVendorOSRecord(teamOperation, 'org-1', 'branch-1', {
        invited_email: 'ops@example.com',
        role: 'manager',
        status: 'invited',
        display_name: 'Ops Manager',
      }),
    ).resolves.toEqual(row);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer vendor-token',
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      module: 'team',
      organizationId: 'org-1',
      branchId: 'branch-1',
      payload: {
        invited_by: 'user-1',
        invited_email: 'ops@example.com',
        role: 'manager',
        status: 'invited',
        display_name: 'Ops Manager',
        is_active: true,
        accepted_at: null,
      },
    });
  });

  it('creates branch-scoped module settings through generic record creation', async () => {
    const settingsOperation: VendorOSOperation = {
      module: 'settings',
      table: 'vendor_os_module_settings',
      titleField: 'module',
      statusField: 'is_enabled',
      createFields: [],
    };
    const row: VendorOSRecordRow = {
      id: 'setting-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      module: 'pms',
      is_enabled: false,
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ record: row }), { status: 200 }),
    );

    await expect(
      createVendorOSRecord(settingsOperation, 'org-1', 'branch-1', {
        module: 'pms',
        is_enabled: false,
        settings: { policy_note: 'Disable PMS during renovation' },
      }),
    ).resolves.toEqual(row);

    expect(fetch).toHaveBeenCalledWith('/api/vendor-os/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'settings',
        organizationId: 'org-1',
        branchId: 'branch-1',
        payload: {
          module: 'pms',
          is_enabled: false,
          settings: { policy_note: 'Disable PMS during renovation' },
        },
      }),
    });
  });

  it('maps marketplace listing fields into sync metadata during generic creates', async () => {
    const marketplaceOperation: VendorOSOperation = {
      module: 'marketplace',
      table: 'vendor_marketplace_syncs',
      titleField: 'module',
      statusField: 'sync_status',
      createFields: [],
    };
    const row: VendorOSRecordRow = {
      id: 'sync-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      module: 'pms',
      sync_status: 'synced',
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ record: row }), { status: 200 }),
    );

    await expect(
      createVendorOSRecord(marketplaceOperation, 'org-1', 'branch-1', {
        listing_title: 'Private Villa Goa',
        public_slug: 'private-villa-goa',
        module: 'pms',
        sync_status: 'synced',
        conversion_rate: 8.4,
        direct_deal_enabled: true,
        deal_badge: '30% off',
      }),
    ).resolves.toEqual(row);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer vendor-token',
    });
    expect(JSON.parse(String(init.body))).toMatchObject({
      module: 'marketplace',
      organizationId: 'org-1',
      branchId: 'branch-1',
      payload: {
        module: 'pms',
        sync_status: 'synced',
        conversion_rate: 8.4,
        metadata: {
          listing_title: 'Private Villa Goa',
          public_slug: 'private-villa-goa',
          direct_deal_enabled: true,
          deal_badge: '30% off',
          source: 'marketplace_workspace',
        },
      },
    });
    expect(JSON.parse(String(init.body)).payload.last_synced_at).toEqual(expect.any(String));
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
    vi.mocked(supabase.storage.from).mockReturnValue({ upload } as never);
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ allowed: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ record: row }), { status: 200 }));

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
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/vendor-os/mutations/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'documents',
        action: 'upload',
        organizationId: 'org-1',
      }),
    });
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/vendor-os/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer vendor-token',
      },
      body: JSON.stringify({
        module: 'documents',
        organizationId: 'org-1',
        branchId: 'branch-1',
        payload: {
          module: 'documents',
          uploaded_by: 'user-1',
          entity_type: null,
          entity_id: null,
          name: 'Hotel Trade License',
          document_type: 'license',
          storage_path: 'organizations/org-1/branches/branch-1/license/123456-hotel-trade-license.pdf',
          mime_type: 'application/pdf',
          file_size_bytes: file.size,
          status: 'active',
          metadata: {},
        },
      }),
    });
  });

  it('creates a short-lived signed URL for private vendor documents', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://storage.example.com/signed-license.pdf' },
      error: null,
    });
    vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrl } as never);

    await expect(createVendorDocumentSignedUrl('organizations/org-1/license/file.pdf')).resolves.toEqual(
      'https://storage.example.com/signed-license.pdf',
    );

    expect(supabase.storage.from).toHaveBeenCalledWith(VENDOR_DOCUMENTS_BUCKET);
    expect(createSignedUrl).toHaveBeenCalledWith('organizations/org-1/license/file.pdf', 300);
  });

  it('still updates through the worker route even when direct client audit identity is unavailable', async () => {
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
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ record: row }), { status: 200 }),
    );

    await expect(updateVendorOSRecord(operation, 'org-1', 'lead-1', { stage: 'won' })).resolves.toEqual(row);
    expect(fetch).toHaveBeenCalledTimes(1);
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

  it('subscribes to realtime module record changes for an organization and cleans up the channel', () => {
    const onChange = vi.fn();
    const subscribe = vi.fn();
    const on = vi.fn(() => ({ subscribe }));
    const channel = { on, subscribe };

    vi.mocked(supabase.channel).mockReturnValue(channel as never);

    const unsubscribe = subscribeVendorOSRecords(operation, 'org-1', onChange);

    expect(supabase.channel).toHaveBeenCalledWith('vendor-os-records:vendor_leads:org-1');
    expect(on).toHaveBeenCalledWith(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'vendor_leads',
        filter: 'organization_id=eq.org-1',
      },
      onChange,
    );
    expect(subscribe).toHaveBeenCalled();

    unsubscribe();
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
