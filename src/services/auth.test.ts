import { describe, expect, it, vi } from 'vitest';
import { getDashboardPathForRole } from './auth';

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

vi.mock('./profiles', () => ({
  upsertProfile: vi.fn(),
}));

describe('getDashboardPathForRole', () => {
  it('routes vendors to the vendor dashboard', () => {
    expect(getDashboardPathForRole('vendor')).toBe('/vendor');
  });

  it('routes travelers and unknown roles to the traveler dashboard', () => {
    expect(getDashboardPathForRole('traveler')).toBe('/dashboard');
    expect(getDashboardPathForRole(undefined)).toBe('/dashboard');
  });
});
