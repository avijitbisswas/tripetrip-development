import { supabase } from '@/src/lib/supabase';
import type { Profile, UserRole } from '@/src/types/domain';
import { ServiceError, toServiceError } from './errors';

export interface CreateProfileInput {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone?: string | null;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>();

  if (error) {
    throw new ServiceError(error.message, 'PROFILE_READ_FAILED', 500);
  }

  return data;
}

export async function getProfileRole(userId: string) {
  try {
    const profile = await getProfile(userId);
    return profile?.role ?? 'traveler';
  } catch (error) {
    throw toServiceError(error, 'PROFILE_ROLE_FAILED');
  }
}

export async function upsertProfile(input: CreateProfileInput) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: input.id,
        role: input.role,
        full_name: input.full_name,
        phone: input.phone ?? null,
      },
      { onConflict: 'id' },
    )
    .select()
    .single<Profile>();

  if (error) {
    throw new ServiceError(error.message, 'PROFILE_WRITE_FAILED', 500);
  }

  return data;
}
