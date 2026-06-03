import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVendorOSNotifications, useVendorOSTenant } from './hooks';
import type { VendorBranch, VendorNotification, VendorOrganization, VendorTeamMember } from './types';

vi.mock('./api', () => ({
  listVendorOrganizations: vi.fn(),
  listVendorBranches: vi.fn(),
  listVendorTeamMembers: vi.fn(),
  listVendorNotifications: vi.fn(),
}));

import {
  listVendorBranches,
  listVendorNotifications,
  listVendorOrganizations,
  listVendorTeamMembers,
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
});
