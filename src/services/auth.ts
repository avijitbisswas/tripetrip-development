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

export async function registerWithEmail(input: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ServiceError(payload.error || 'Registration failed', 'SIGN_UP_FAILED', response.status);
  }

  const payload = (await response.json()) as {
    user?: {
      id?: string;
      role?: UserRole;
      fullName?: string;
    };
  };

  if (!payload.user?.id) {
    throw new ServiceError('Registration failed', 'SIGN_UP_FAILED', 500);
  }

  if (!supabaseConfig.isConfigured) {
    writeLocalAuthUser({
      id: payload.user.id,
      email: input.email,
      role: payload.user.role,
      fullName: payload.user.fullName,
    });
    return toTripetripUser({
      id: payload.user.id,
      email: input.email,
      role: payload.user.role,
      fullName: payload.user.fullName,
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    throw new ServiceError(error?.message || 'Registration succeeded, but sign in failed', 'SIGN_IN_FAILED', 401);
  }

  return toEnrichedSupabaseUser(data.user);
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
