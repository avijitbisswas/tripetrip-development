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

    vi.mocked(supabase.from).mockReturnValue({ update } as never);

    await expect(updateVendorOSRecord(operation, 'lead-1', { stage: 'won' })).resolves.toEqual(row);
    expect(supabase.from).toHaveBeenCalledWith('vendor_leads');
    expect(update).toHaveBeenCalledWith({ stage: 'won' });
    expect(eq).toHaveBeenCalledWith('id', 'lead-1');
  });

  it('deletes a module record in its mapped table', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteRecord = vi.fn(() => ({ eq }));

    vi.mocked(supabase.from).mockReturnValue({ delete: deleteRecord } as never);

    await expect(deleteVendorOSRecord(operation, 'lead-1')).resolves.toEqual({ id: 'lead-1' });
    expect(supabase.from).toHaveBeenCalledWith('vendor_leads');
    expect(deleteRecord).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith('id', 'lead-1');
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

    vi.mocked(supabase.from).mockReturnValue({ insert } as never);

    const { createVendorOSRecord } = await import('./api');

    await expect(createVendorOSRecord(branchOperation, 'org-1', 'branch-1', { name: 'Goa Office' })).resolves.toEqual(row);
    expect(insert).toHaveBeenCalledWith({ organization_id: 'org-1', name: 'Goa Office' });
  });
});
