import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useVendorDocumentUpload,
  useVendorOSNotifications,
  useVendorOSRecordMutations,
  useVendorOSRecords,
  useVendorOSTenant,
} from './hooks';
import type { VendorBranch, VendorNotification, VendorOrganization, VendorTeamMember } from './types';

vi.mock('./api', () => ({
  listVendorOrganizations: vi.fn(),
  listVendorBranches: vi.fn(),
  listVendorTeamMembers: vi.fn(),
  listVendorNotifications: vi.fn(),
  listVendorOSRecords: vi.fn(),
  createVendorOSRecord: vi.fn(),
  updateVendorOSRecord: vi.fn(),
  deleteVendorOSRecord: vi.fn(),
  markVendorNotificationRead: vi.fn(),
  subscribeVendorNotifications: vi.fn(),
  uploadVendorDocumentFile: vi.fn(),
}));

import {
  createVendorOSRecord,
  deleteVendorOSRecord,
  listVendorBranches,
  listVendorNotifications,
  listVendorOSRecords,
  listVendorOrganizations,
  listVendorTeamMembers,
  markVendorNotificationRead,
  subscribeVendorNotifications,
  uploadVendorDocumentFile,
  updateVendorOSRecord,
} from './api';

const organization: VendorOrganization = {
  id: 'org-1',
  owner_user_id: 'user-1',
  primary_vendor_profile_id: null,
  name: 'Himalayan Escape Group',
  legal_name: null,
  slug: 'himalayan-escape',
  description: null,
  logo_url: null,
  cover_url: null,
  default_currency: 'INR',
  timezone: 'Asia/Kolkata',
  categories: ['hotel', 'tour_operator'],
  settings: {},
  is_active: true,
  created_at: '2026-06-03T00:00:00.000Z',
  updated_at: null,
};

const branch: VendorBranch = {
  id: 'branch-1',
  organization_id: 'org-1',
  name: 'Manali Hotel',
  branch_code: null,
  categories: ['hotel'],
  address: null,
  city: 'Manali',
  state: 'Himachal Pradesh',
  country: 'India',
  pincode: null,
  lat: null,
  lng: null,
  phone: null,
  email: null,
  manager_user_id: null,
  settings: {},
  is_active: true,
  created_at: '2026-06-03T00:00:00.000Z',
  updated_at: null,
};

const member: VendorTeamMember = {
  id: 'member-1',
  organization_id: 'org-1',
  branch_id: null,
  user_id: 'user-2',
  role: 'staff',
  title: 'Front Desk',
  invited_email: null,
  invited_by: null,
  accepted_at: '2026-06-03T00:00:00.000Z',
  is_active: true,
  created_at: '2026-06-03T00:00:00.000Z',
};

const unread: VendorNotification = {
  id: 'note-1',
  organization_id: 'org-1',
  branch_id: null,
  recipient_user_id: 'user-1',
  module: 'calendar',
  title: 'New booking',
  body: null,
  status: 'unread',
  priority: 'info',
  action_url: null,
  metadata: {},
  created_at: '2026-06-03T00:00:00.000Z',
  read_at: null,
};

describe('Vendor OS hooks', () => {
  beforeEach(() => {
    vi.mocked(listVendorOrganizations).mockResolvedValue([organization]);
    vi.mocked(listVendorBranches).mockResolvedValue([branch]);
    vi.mocked(listVendorTeamMembers).mockResolvedValue([member]);
    vi.mocked(listVendorNotifications).mockResolvedValue([unread, { ...unread, id: 'note-2', status: 'read' }]);
    vi.mocked(listVendorOSRecords).mockResolvedValue([]);
    vi.mocked(createVendorOSRecord).mockResolvedValue({
      id: 'lead-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      title: 'Goa group trip',
      stage: 'new',
    });
    vi.mocked(updateVendorOSRecord).mockResolvedValue({
      id: 'lead-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      title: 'Goa group trip',
      stage: 'won',
    });
    vi.mocked(deleteVendorOSRecord).mockResolvedValue({ id: 'lead-1' });
    vi.mocked(markVendorNotificationRead).mockResolvedValue({ ...unread, status: 'read' });
    vi.mocked(subscribeVendorNotifications).mockReturnValue(vi.fn());
    vi.mocked(uploadVendorDocumentFile).mockResolvedValue({
      id: 'doc-1',
      organization_id: 'org-1',
      branch_id: 'branch-1',
      uploaded_by: 'user-1',
      module: 'documents',
      name: 'Hotel Trade License',
      document_type: 'license',
      storage_path: 'organizations/org-1/branches/branch-1/license/file.pdf',
      mime_type: 'application/pdf',
      file_size_bytes: 7,
      status: 'active',
      expires_at: null,
      entity_type: null,
      entity_id: null,
      metadata: {},
      created_at: '2026-06-03T00:00:00.000Z',
    });
  });

  it('loads tenant context and exposes permission helper', async () => {
    const { result } = renderHook(() => useVendorOSTenant('user-2'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.selectedOrganization?.name).toBe('Himalayan Escape Group');
    expect(result.current.activeBranch?.name).toBe('Manali Hotel');
    expect(result.current.role).toBe('staff');
    expect(result.current.can('calendar', 'view')).toBe(true);
    expect(result.current.can('accounting', 'view')).toBe(false);
  });

  it('returns unread notification count', async () => {
    const { result } = renderHook(() => useVendorOSNotifications('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it('marks notifications as read and refreshes notification state', async () => {
    vi.mocked(listVendorNotifications)
      .mockResolvedValueOnce([unread])
      .mockResolvedValueOnce([{ ...unread, status: 'read', read_at: '2026-06-03T00:05:00.000Z' }]);

    const { result } = renderHook(() => useVendorOSNotifications('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.unreadCount).toBe(1);

    await act(async () => {
      await result.current.markAsRead('note-1');
    });

    expect(markVendorNotificationRead).toHaveBeenCalledWith('note-1');
    expect(result.current.notifications[0].status).toBe('read');
    expect(result.current.unreadCount).toBe(0);
  });

  it('subscribes to realtime notification updates and cleans up on unmount', async () => {
    const unsubscribe = vi.fn();
    let realtimeHandler: (() => void) | undefined;
    vi.mocked(subscribeVendorNotifications).mockImplementation((_userId, handler) => {
      realtimeHandler = handler;
      return unsubscribe;
    });
    vi.mocked(listVendorNotifications)
      .mockResolvedValueOnce([unread])
      .mockResolvedValueOnce([{ ...unread, id: 'note-2', title: 'New direct booking' }]);

    const { result, unmount } = renderHook(() => useVendorOSNotifications('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(subscribeVendorNotifications).toHaveBeenCalledWith('user-1', expect.any(Function));

    await act(async () => {
      realtimeHandler?.();
    });

    expect(vi.mocked(listVendorNotifications).mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.current.notifications[0].title).toBe('New direct booking');

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('reloads module records on demand', async () => {
    vi.mocked(listVendorOSRecords)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'lead-1',
          organization_id: 'org-1',
          title: 'Goa group trip',
          stage: 'new',
        },
      ]);

    const { result } = renderHook(() => useVendorOSRecords('crm', 'org-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.records).toHaveLength(0);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.records[0].title).toBe('Goa group trip');
  });

  it('creates, updates, and deletes records through module mutations', async () => {
    const { result } = renderHook(() => useVendorOSRecordMutations('crm', 'org-1', 'branch-1'));

    await act(async () => {
      await result.current.createRecord({ title: 'Goa group trip', stage: 'new' });
      await result.current.updateRecord('lead-1', { stage: 'won' });
      await result.current.deleteRecord('lead-1');
    });

    expect(createVendorOSRecord).toHaveBeenCalledWith(expect.objectContaining({ table: 'vendor_leads' }), 'org-1', 'branch-1', {
      title: 'Goa group trip',
      stage: 'new',
    });
    expect(updateVendorOSRecord).toHaveBeenCalledWith(expect.objectContaining({ table: 'vendor_leads' }), 'lead-1', {
      stage: 'won',
    });
    expect(deleteVendorOSRecord).toHaveBeenCalledWith(expect.objectContaining({ table: 'vendor_leads' }), 'lead-1');
    expect(result.current.submitting).toBe(false);
  });

  it('uploads document files through the document upload hook', async () => {
    const file = new File(['license'], 'license.pdf', { type: 'application/pdf' });
    const { result } = renderHook(() => useVendorDocumentUpload('org-1', 'branch-1'));

    await act(async () => {
      await result.current.uploadDocument({
        name: 'Hotel Trade License',
        document_type: 'license',
        status: 'active',
        file,
      });
    });

    expect(uploadVendorDocumentFile).toHaveBeenCalledWith({
      organizationId: 'org-1',
      branchId: 'branch-1',
      module: 'documents',
      name: 'Hotel Trade License',
      documentType: 'license',
      status: 'active',
      file,
    });
    expect(result.current.submitting).toBe(false);
  });
});
