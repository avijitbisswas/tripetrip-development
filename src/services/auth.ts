import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import type { UserRole } from '@/src/types/domain';
import { ServiceError } from './errors';
import { upsertProfile } from './profiles';

export interface AuthState {
  session: Session | null;
  user: User | null;
}

export function getDashboardPathForRole(role?: UserRole | null) {
  return role === 'vendor' ? '/vendor' : '/dashboard';
}

export async function getCurrentSession(): Promise<AuthState> {
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
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        role: input.role,
      },
    },
  });

  if (error) {
    throw new ServiceError(error.message, 'SIGN_UP_FAILED', 400);
  }

  if (data.user) {
    await upsertProfile({
      id: data.user.id,
      role: input.role,
      full_name: input.fullName,
    });
  }

  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new ServiceError(error.message, 'SIGN_OUT_FAILED', 500);
  }
}
