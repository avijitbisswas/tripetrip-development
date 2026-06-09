import { describe, expect, it, vi } from 'vitest';
import { supabase } from '@/src/lib/supabase';
import { getDashboardPathForRole, registerWithEmail } from './auth';

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

describe('getDashboardPathForRole', () => {
  it('routes vendors to the vendor dashboard', () => {
    expect(getDashboardPathForRole('vendor')).toBe('/vendor');
  });

  it('routes travelers and unknown roles to the traveler dashboard', () => {
    expect(getDashboardPathForRole('traveler')).toBe('/dashboard');
    expect(getDashboardPathForRole(undefined)).toBe('/dashboard');
  });
});

describe('registerWithEmail', () => {
  it('creates accounts through the server registration endpoint', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
        },
      },
      error: null,
    } as never);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            id: 'user-1',
            role: 'vendor',
            fullName: 'QA Vendor',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    try {
      const user = await registerWithEmail({
        email: 'qa.vendor@gmail.com',
        password: 'TestPass123!',
        fullName: 'QA Vendor',
        role: 'vendor',
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'qa.vendor@gmail.com',
          password: 'TestPass123!',
          fullName: 'QA Vendor',
          role: 'vendor',
        }),
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'qa.vendor@gmail.com',
        password: 'TestPass123!',
      });
      expect(user.id).toBe('user-1');
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('surfaces server registration errors', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'email rate limit exceeded' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    try {
      await expect(
        registerWithEmail({
          email: 'qa.vendor@gmail.com',
          password: 'TestPass123!',
          fullName: 'QA Vendor',
          role: 'vendor',
        }),
      ).rejects.toMatchObject({
        message: 'email rate limit exceeded',
        code: 'SIGN_UP_FAILED',
        status: 429,
      });
    } finally {
      fetchMock.mockRestore();
    }
  });
});
