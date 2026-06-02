import { supabase } from '@/src/lib/supabase';
import type { VendorProfile } from '@/src/types/domain';
import { ServiceError } from './errors';

export interface VendorProfileInput {
  user_id: string;
  business_name: string;
  business_type: string;
  slug: string;
  business_email?: string | null;
  business_phone?: string | null;
  description?: string | null;
}

export async function getVendorByUserId(userId: string) {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle<VendorProfile>();

  if (error) {
    throw new ServiceError(error.message, 'VENDOR_READ_FAILED', 500);
  }

  return data;
}

export async function getVendorBySlug(slug: string) {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single<VendorProfile>();

  if (error) {
    throw new ServiceError(error.message, 'VENDOR_SLUG_READ_FAILED', 404);
  }

  return data;
}

export async function upsertVendorProfile(input: VendorProfileInput) {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .upsert(input, { onConflict: 'user_id' })
    .select()
    .single<VendorProfile>();

  if (error) {
    throw new ServiceError(error.message, 'VENDOR_WRITE_FAILED', 500);
  }

  return data;
}
