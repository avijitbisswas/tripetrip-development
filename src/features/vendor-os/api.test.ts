import { describe, expect, it, vi, beforeEach } from 'vitest';
import { supabase } from '@/src/lib/supabase';
import {
  deleteVendorOSRecord,
  updateVendorOSRecord,
  type VendorOSRecordRow,
} from './api';
import type { VendorOSOperation } from './operations';

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
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

    const { createVendorOSRecord } = await import('./api');

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
});
