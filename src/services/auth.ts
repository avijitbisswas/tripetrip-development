import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfig } from '@/src/lib/supabase';
import type { UserRole } from '@/src/types/domain';
import { ServiceError } from './errors';

export interface AuthState {
  session: Session | null;
  user: User | null;
}

export function getDashboardPathForRole(role?: UserRole | null) {
  return role === 'vendor' ? '/vendor' : '/dashboard';
}

export async function getCurrentSession(): Promise<AuthState> {
  if (!supabaseConfig.isConfigured) {
    return {
      session: null,
      user: null,
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
    return () => undefined;
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new ServiceError(error.message, 'SIGN_IN_FAILED', 401);
  }

  return data.user;
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user) {
    throw new ServiceError(error?.message || 'Registration succeeded, but sign in failed', 'SIGN_IN_FAILED', 401);
  }

  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new ServiceError(error.message, 'SIGN_OUT_FAILED', 500);
  }
}
