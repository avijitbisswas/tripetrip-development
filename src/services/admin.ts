import { supabase } from '@/src/lib/supabase';

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) {
    throw new Error('Log in with an admin account to access the control center');
  }

  return token;
}

async function adminFetch<T>(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || 'Admin request failed');
  }
  return payload;
}

export function getAdminOverview() {
  return adminFetch<{
    metrics: Record<string, number>;
    featureFlags: Record<string, boolean>;
    recentAdminActions: Array<Record<string, unknown>>;
  }>('/api/admin/overview');
}

export function listAdminUsers() {
  return adminFetch<{ users: Array<Record<string, unknown>> }>('/api/admin/users');
}

export function updateAdminUser(input: Record<string, unknown>) {
  return adminFetch<{ success: true }>('/api/admin/users', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listAdminVendors() {
  return adminFetch<{ vendors: Array<Record<string, unknown>> }>('/api/admin/vendors');
}

export function updateAdminVendor(input: Record<string, unknown>) {
  return adminFetch<{ success: true }>('/api/admin/vendors', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listAdminListings() {
  return adminFetch<{ listings: Array<Record<string, unknown>> }>('/api/admin/listings');
}

export function updateAdminListing(input: Record<string, unknown>) {
  return adminFetch<{ success: true }>('/api/admin/listings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listAdminMarketplaceSyncs() {
  return adminFetch<{ syncs: Array<Record<string, unknown>> }>('/api/admin/marketplace-syncs');
}

export function updateAdminMarketplaceSync(input: Record<string, unknown>) {
  return adminFetch<{ success: true }>('/api/admin/marketplace-syncs', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listAdminBookings() {
  return adminFetch<{ bookings: Array<Record<string, unknown>> }>('/api/admin/bookings');
}

export function updateAdminBooking(input: Record<string, unknown>) {
  return adminFetch<{ success: true }>('/api/admin/bookings', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function listAdminManualPayments() {
  return adminFetch<{ payments: Array<Record<string, unknown>> }>('/api/admin/payments/manual');
}

export function updateAdminManualPayment(paymentId: string, action: 'approve' | 'reject') {
  return adminFetch<{ success?: true; payment?: Record<string, unknown> }>(`/api/admin/payments/${paymentId}/${action}`, {
    method: 'POST',
  });
}

export function listAdminCommunityPosts() {
  return adminFetch<{ posts: Array<Record<string, unknown>> }>('/api/admin/community/posts');
}

export function removeAdminCommunityPost(postId: string) {
  return adminFetch<{ success: true }>('/api/admin/community/posts', {
    method: 'DELETE',
    body: JSON.stringify({ postId }),
  });
}

export function listAdminDeals() {
  return adminFetch<{ deals: Array<Record<string, unknown>> }>('/api/admin/deals');
}

export function getAdminContentConfig() {
  return adminFetch<{ config: Record<string, unknown>; preview: Record<string, unknown> }>('/api/admin/content');
}

export function saveAdminContentConfig(input: Record<string, unknown>) {
  return adminFetch<{ success: true }>('/api/admin/content', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function getAdminSystemState() {
  return adminFetch<{
    configHealth: Record<string, unknown>;
    readiness?: Record<string, unknown>;
    siteConfig: Record<string, unknown>;
    health: Record<string, unknown>;
  }>('/api/admin/system');
}

export function saveAdminSystemConfig(input: Record<string, unknown>) {
  return adminFetch<{ success: true }>('/api/admin/system', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function listAdminAuditEntries() {
  return adminFetch<{ entries: Array<Record<string, unknown>> }>('/api/admin/audit');
}

export function listAdminAccommodationAccess() {
  return adminFetch<{ vendors: Array<Record<string, unknown>> }>('/api/admin/accommodation/access');
}

export function saveAdminAccommodationAccess(input: Record<string, unknown>) {
  return adminFetch<{ success: true; access: Record<string, unknown> }>('/api/admin/accommodation/access', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function getPublicSiteConfig() {
  return fetch('/api/public/site-config').then(async (response) => {
    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok) throw new Error('Unable to load site configuration');
    return payload;
  });
}
