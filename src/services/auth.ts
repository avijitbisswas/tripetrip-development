import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfig } from '@/src/lib/supabase';
import type { UserRole } from '@/src/types/domain';
import { ServiceError } from './errors';

const localAuthStorageKey = 'tripetrip.localAuthUser';
const localAuthEventName = 'tripetrip:auth-state';

export interface AuthState {
  session: Session | null;
  user: User | null;
}

type ApiAuthUser = {
  id: string;
  email?: string | null;
  role?: UserRole | null;
  fullName?: string | null;
};

export type TripetripUser = User & {
  role?: UserRole;
  fullName?: string | null;
};

function isUserRole(value: unknown): value is UserRole {
  return value === 'traveler' || value === 'vendor' || value === 'admin';
}

function getRoleFromSupabaseUser(user: User) {
  const metadataRole = user.user_metadata?.role ?? user.app_metadata?.role;
  return isUserRole(metadataRole) ? metadataRole : undefined;
}

function getFullNameFromSupabaseUser(user: User) {
  const metadataFullName = user.user_metadata?.full_name ?? user.user_metadata?.fullName;
  return typeof metadataFullName === 'string' && metadataFullName.trim() ? metadataFullName : null;
}

function toEnrichedSupabaseUser(user: User): TripetripUser {
  return {
    ...user,
    role: getRoleFromSupabaseUser(user),
    fullName: getFullNameFromSupabaseUser(user),
  } as TripetripUser;
}

function toTripetripUser(user: ApiAuthUser): TripetripUser {
  return {
    id: user.id,
    email: user.email || undefined,
    role: user.role || 'traveler',
    fullName: user.fullName || null,
    app_metadata: {},
    user_metadata: {
      full_name: user.fullName || null,
      role: user.role || 'traveler',
    },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as TripetripUser;
}

function readLocalAuthUser() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(localAuthStorageKey);
    if (!stored) return null;
    return toTripetripUser(JSON.parse(stored) as ApiAuthUser);
  } catch {
    return null;
  }
}

function writeLocalAuthUser(user: ApiAuthUser | null) {
  if (typeof window === 'undefined') return;

  if (user) {
    window.localStorage.setItem(localAuthStorageKey, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(localAuthStorageKey);
  }

  window.dispatchEvent(new Event(localAuthEventName));
}

export function getDashboardPathForRole(role?: UserRole | null) {
  return role === 'vendor' ? '/vendor' : '/dashboard';
}

export async function getCurrentSession(): Promise<AuthState> {
  if (!supabaseConfig.isConfigured) {
    return {
      session: null,
      user: readLocalAuthUser(),
    };
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new ServiceError(error.message, 'SESSION_READ_FAILED', 401);
  }

  return {
    session: data.session,
    user: data.session?.user ?? null,
  };
}

export function subscribeToAuthState(callback: (state: AuthState) => void) {
  if (!supabaseConfig.isConfigured) {
    if (typeof window === 'undefined') return () => undefined;

    const handleLocalAuth = () => {
      callback({
        session: null,
        user: readLocalAuthUser(),
      });
    };

    window.addEventListener(localAuthEventName, handleLocalAuth);
    return () => window.removeEventListener(localAuthEventName, handleLocalAuth);
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({
      session,
      user: session?.user ?? null,
    });
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabaseConfig.isConfigured) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      user?: ApiAuthUser;
    };

    if (!response.ok || !payload.user?.id) {
      throw new ServiceError(payload.error || 'Login failed', 'SIGN_IN_FAILED', response.status);
    }

    writeLocalAuthUser(payload.user);
    return toTripetripUser(payload.user);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new ServiceError(error.message, 'SIGN_IN_FAILED', 401);
  }

  return toEnrichedSupabaseUser(data.user);
}

async function readJsonOrThrow<T>(response: Response, fallbackMessage: string, code: string) {
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new ServiceError(payload.error || fallbackMessage, code, response.status);
  }

  return payload;
}

export async function requestRegistrationOtp(input: {
  email: string;
  fullName: string;
  mobile: string;
  role: UserRole;
}) {
  const response = await fetch('/api/auth/register/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return readJsonOrThrow<{
    challengeToken: string;
    expiresAt: string;
    maskedEmail: string;
  }>(response, 'Registration failed', 'SIGN_UP_FAILED');
}

export async function completeRegistration(input: {
  challengeToken: string;
  otp: string;
  password: string;
  email: string;
}) {
  const response = await fetch('/api/auth/register/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeToken: input.challengeToken,
      otp: input.otp,
      password: input.password,
    }),
  });

  const payload = await readJsonOrThrow<{
    user?: {
      id?: string;
      role?: UserRole;
      fullName?: string;
      email?: string;
      phone?: string;
    };
  }>(response, 'Registration failed', 'SIGN_UP_FAILED');

  if (!payload.user?.id) {
    throw new ServiceError('Registration failed', 'SIGN_UP_FAILED', 500);
  }

  if (!supabaseConfig.isConfigured) {
    writeLocalAuthUser({
      id: payload.user.id,
      email: payload.user.email || input.email,
      role: payload.user.role,
      fullName: payload.user.fullName,
    });
    return toTripetripUser({
      id: payload.user.id,
      email: payload.user.email || input.email,
      role: payload.user.role,
      fullName: payload.user.fullName,
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.user.email || input.email,
    password: input.password,
  });

  if (error || !data.user) {
    throw new ServiceError(error?.message || 'Registration succeeded, but sign in failed', 'SIGN_IN_FAILED', 401);
  }

  return toEnrichedSupabaseUser(data.user);
}

export async function requestPasswordResetOtp(email: string) {
  const response = await fetch('/api/auth/password/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  return readJsonOrThrow<{
    challengeToken: string;
    expiresAt: string;
    maskedEmail: string;
  }>(response, 'Password reset failed', 'PASSWORD_RESET_REQUEST_FAILED');
}

export async function completePasswordReset(input: {
  challengeToken: string;
  otp: string;
  password: string;
}) {
  const response = await fetch('/api/auth/password/reset-with-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  return readJsonOrThrow<{
    success: true;
    email: string;
  }>(response, 'Password reset failed', 'PASSWORD_RESET_FAILED');
}

export async function signOut() {
  if (!supabaseConfig.isConfigured) {
    writeLocalAuthUser(null);
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new ServiceError(error.message, 'SIGN_OUT_FAILED', 500);
  }
}
