import { describe, expect, it, vi } from 'vitest';
import {
  handleRequestPasswordResetOtp,
  handleRequestRegistrationOtp,
  handleResetPasswordWithOtp,
  handleVerifyRegistrationOtp,
} from './otpFlow';

describe('OTP auth flow', () => {
  it('requests a registration OTP with validated email and mobile fields', async () => {
    const sendOtpEmail = vi.fn(async () => undefined);
    const result = await handleRequestRegistrationOtp(
      {
        email: 'new.user@example.com',
        fullName: 'New User',
        mobile: '9876543210',
        role: 'vendor',
      },
      {
        findUserByEmail: vi.fn(async () => null),
        createChallengeToken: vi.fn(() => 'challenge-token'),
        sendOtpEmail,
        generateOtp: () => '654321',
        now: () => new Date('2026-06-25T12:00:00.000Z'),
      },
    );

    expect(result).toEqual({
      status: 200,
      body: {
        challengeToken: 'challenge-token',
        expiresAt: '2026-06-25T12:10:00.000Z',
        maskedEmail: 'n***r@example.com',
      },
    });
    expect(sendOtpEmail).toHaveBeenCalledWith({
      to: 'new.user@example.com',
      otp: '654321',
      purpose: 'register',
      fullName: 'New User',
    });
  });

  it('blocks registration OTP requests when the account already exists', async () => {
    const result = await handleRequestRegistrationOtp(
      {
        email: 'existing@example.com',
        fullName: 'Existing User',
        mobile: '+919876543210',
        role: 'traveler',
      },
      {
        findUserByEmail: vi.fn(async () => ({ id: 'user-1', email: 'existing@example.com' })),
        createChallengeToken: vi.fn(),
        sendOtpEmail: vi.fn(),
        generateOtp: () => '654321',
        now: () => new Date('2026-06-25T12:00:00.000Z'),
      },
    );

    expect(result).toEqual({
      status: 409,
      body: { error: 'An account with this email already exists' },
    });
  });

  it('creates the real account only after a valid signup OTP is verified', async () => {
    const adminAuth = {
      createUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(),
    };
    const tables: Record<string, unknown[]> = {};
    const result = await handleVerifyRegistrationOtp(
      {
        challengeToken: 'challenge-token',
        otp: '654321',
        password: 'Tripetrip@123',
      },
      {
        verifyChallengeToken: vi.fn(() => ({
          purpose: 'register' as const,
          email: 'new.user@example.com',
          fullName: 'New User',
          mobile: '+919876543210',
          role: 'vendor' as const,
          otp: '654321',
          expiresAt: '2026-06-25T12:10:00.000Z',
        })),
        adminAuth,
        supabase: createSupabaseMock(tables),
        now: () => new Date('2026-06-25T12:05:00.000Z'),
      },
    );

    expect(result).toEqual({
      status: 200,
      body: {
        user: {
          id: 'user-1',
          role: 'vendor',
          fullName: 'New User',
          email: 'new.user@example.com',
          phone: '+919876543210',
        },
      },
    });
    expect(adminAuth.createUser).toHaveBeenCalledWith({
      email: 'new.user@example.com',
      password: 'Tripetrip@123',
      email_confirm: true,
      user_metadata: {
        full_name: 'New User',
        role: 'vendor',
        phone: '+919876543210',
      },
    });
  });

  it('requests a password reset OTP only for existing accounts', async () => {
    const sendOtpEmail = vi.fn(async () => undefined);
    const result = await handleRequestPasswordResetOtp(
      { email: 'existing@example.com' },
      {
        findUserByEmail: vi.fn(async () => ({ id: 'user-9', email: 'existing@example.com' })),
        createChallengeToken: vi.fn(() => 'reset-token'),
        sendOtpEmail,
        generateOtp: () => '112233',
        now: () => new Date('2026-06-25T12:00:00.000Z'),
      },
    );

    expect(result).toEqual({
      status: 200,
      body: {
        challengeToken: 'reset-token',
        expiresAt: '2026-06-25T12:10:00.000Z',
        maskedEmail: 'e***g@example.com',
      },
    });
    expect(sendOtpEmail).toHaveBeenCalledWith({
      to: 'existing@example.com',
      otp: '112233',
      purpose: 'reset-password',
      fullName: undefined,
    });
  });

  it('updates the password after a valid reset OTP is verified', async () => {
    const adminAuth = {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(async () => ({ data: { user: { id: 'user-9' } }, error: null })),
    };
    const result = await handleResetPasswordWithOtp(
      {
        challengeToken: 'reset-token',
        otp: '112233',
        password: 'NewTripetrip@123',
      },
      {
        verifyChallengeToken: vi.fn(() => ({
          purpose: 'reset-password' as const,
          email: 'existing@example.com',
          userId: 'user-9',
          otp: '112233',
          expiresAt: '2026-06-25T12:10:00.000Z',
        })),
        adminAuth,
        now: () => new Date('2026-06-25T12:05:00.000Z'),
      },
    );

    expect(result).toEqual({
      status: 200,
      body: {
        success: true,
        email: 'existing@example.com',
      },
    });
    expect(adminAuth.updateUserById).toHaveBeenCalledWith('user-9', {
      password: 'NewTripetrip@123',
      email_confirm: true,
    });
  });
});

function createSupabaseMock(tables: Record<string, unknown[]>, options: { failTable?: string } = {}) {
  return {
    from: (table: string) => ({
      upsert: (row: unknown) => ({
        select: () => ({
          single: async () => {
            if (options.failTable === table) {
              return { data: null, error: { message: `${table} failed` } };
            }

            tables[table] = [...(tables[table] || []), row];
            return { data: row, error: null };
          },
        }),
      }),
    }),
  };
}
