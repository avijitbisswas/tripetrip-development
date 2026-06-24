import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/src/lib/supabase';
import { getCurrentSession, getDashboardPathForRole, registerWithEmail, signInWithEmail, signOut } from './auth';

const supabaseConfigMock = vi.hoisted(() => ({
  isConfigured: true,
}));

vi.mock('@/src/lib/supabase', () => ({
  supabaseConfig: supabaseConfigMock,
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

beforeEach(() => {
  supabaseConfigMock.isConfigured = true;
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('getDashboardPathForRole', () => {
  it('routes vendors to the vendor dashboard', () => {
    expect(getDashboardPathForRole('vendor')).toBe('/vendor');
  });

  it('routes travelers and unknown roles to the traveler dashboard', () => {
    expect(getDashboardPathForRole('traveler')).toBe('/dashboard');
    expect(getDashboardPathForRole(undefined)).toBe('/dashboard');
  });
});

describe('signInWithEmail', () => {
  it('uses the server login endpoint when browser Supabase config is missing', async () => {
    supabaseConfigMock.isConfigured = false;
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            id: 'vendor-1',
            email: 'demo.vendor@tripetrip.test',
            role: 'vendor',
            fullName: 'Demo Vendor',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const user = await signInWithEmail('demo.vendor@tripetrip.test', 'Tripetrip@123');

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo.vendor@tripetrip.test',
        password: 'Tripetrip@123',
      }),
    });
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(user).toMatchObject({
      id: 'vendor-1',
      email: 'demo.vendor@tripetrip.test',
      role: 'vendor',
      fullName: 'Demo Vendor',
    });
    await expect(getCurrentSession()).resolves.toMatchObject({
      user: {
        id: 'vendor-1',
        role: 'vendor',
      },
    });
  });

  it('clears the local fallback user on sign out', async () => {
    supabaseConfigMock.isConfigured = false;
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: {
            id: 'traveler-1',
            email: 'demo.traveler@tripetrip.test',
            role: 'traveler',
            fullName: 'Demo Traveler',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    await signInWithEmail('demo.traveler@tripetrip.test', 'Tripetrip@123');
    await signOut();

    await expect(getCurrentSession()).resolves.toEqual({ session: null, user: null });
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
