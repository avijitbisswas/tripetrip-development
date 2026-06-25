import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/src/lib/supabase';
import {
  completePasswordReset,
  completeRegistration,
  getCurrentSession,
  getDashboardPathForRole,
  requestPasswordResetOtp,
  requestRegistrationOtp,
  signInWithEmail,
  signOut,
} from './auth';

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
  vi.clearAllMocks();
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
  it('returns the role from Supabase user metadata when browser auth is configured', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        user: {
          id: 'vendor-1',
          email: 'demo.vendor@tripetrip.test',
          user_metadata: {
            role: 'vendor',
            full_name: 'Demo Vendor',
          },
          app_metadata: {},
        },
      },
      error: null,
    } as never);

    const user = await signInWithEmail('demo.vendor@tripetrip.test', 'Tripetrip@123');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'demo.vendor@tripetrip.test',
      password: 'Tripetrip@123',
    });
    expect(user).toMatchObject({
      id: 'vendor-1',
      email: 'demo.vendor@tripetrip.test',
      role: 'vendor',
      fullName: 'Demo Vendor',
    });
  });

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

describe('registration OTP flow', () => {
  it('requests a registration OTP through the server auth endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          challengeToken: 'register-token',
          expiresAt: '2026-06-25T12:10:00.000Z',
          maskedEmail: 'q***r@gmail.com',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    try {
      const response = await requestRegistrationOtp({
        email: 'qa.vendor@gmail.com',
        fullName: 'QA Vendor',
        mobile: '9876543210',
        role: 'vendor',
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/register/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'qa.vendor@gmail.com',
          fullName: 'QA Vendor',
          mobile: '9876543210',
          role: 'vendor',
        }),
      });
      expect(response).toEqual({
        challengeToken: 'register-token',
        expiresAt: '2026-06-25T12:10:00.000Z',
        maskedEmail: 'q***r@gmail.com',
      });
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('creates the account after OTP verification succeeds', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'qa.vendor@gmail.com',
          user_metadata: {
            role: 'vendor',
            full_name: 'QA Vendor',
          },
          app_metadata: {},
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
            email: 'qa.vendor@gmail.com',
            phone: '+919876543210',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    try {
      const user = await completeRegistration({
        challengeToken: 'register-token',
        otp: '123456',
        password: 'TestPass123!',
        email: 'qa.vendor@gmail.com',
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'register-token',
          otp: '123456',
          password: 'TestPass123!',
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
        requestRegistrationOtp({
          email: 'qa.vendor@gmail.com',
          fullName: 'QA Vendor',
          mobile: '9876543210',
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

describe('password reset OTP flow', () => {
  it('requests a password reset OTP', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          challengeToken: 'reset-token',
          expiresAt: '2026-06-25T12:10:00.000Z',
          maskedEmail: 'q***r@gmail.com',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    try {
      const response = await requestPasswordResetOtp('qa.vendor@gmail.com');

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/password/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'qa.vendor@gmail.com' }),
      });
      expect(response.challengeToken).toBe('reset-token');
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('completes a password reset with OTP verification', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          email: 'qa.vendor@gmail.com',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    try {
      const response = await completePasswordReset({
        challengeToken: 'reset-token',
        otp: '654321',
        password: 'NewTripetrip@123',
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/auth/password/reset-with-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: 'reset-token',
          otp: '654321',
          password: 'NewTripetrip@123',
        }),
      });
      expect(response).toEqual({
        success: true,
        email: 'qa.vendor@gmail.com',
      });
    } finally {
      fetchMock.mockRestore();
    }
  });
});
