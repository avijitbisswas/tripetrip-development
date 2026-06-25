import { supabase } from '@/src/lib/supabase';
import type { ResolvedVendorAccommodationAccess } from './accommodationAccess';

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) {
    throw new Error('Log in to load accommodation access');
  }

  return token;
}

export async function getVendorAccommodationAccess(organizationId?: string | null) {
  const token = await getAccessToken();
  const query = organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : '';
  const response = await fetch(`/api/vendor-os/access${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    access?: ResolvedVendorAccommodationAccess | null;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load accommodation access');
  }

  return payload.access || null;
}
