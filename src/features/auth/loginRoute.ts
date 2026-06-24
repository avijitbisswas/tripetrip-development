import type { UserRole } from '@/src/types/domain';

type LoginRequest = {
  email?: string;
  password?: string;
};

type PasswordAuth = {
  signInWithPassword: (input: {
    email: string;
    password: string;
  }) => Promise<{
    data: { user: { id: string; email?: string | null } | null } | null;
    error: { message?: string } | null;
  }>;
};

type ProfileReader = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{
          data: { role?: UserRole | null; full_name?: string | null } | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

export type LoginRouteResult =
  | { status: 200; body: { user: { id: string; email: string; role: UserRole; fullName: string | null } } }
  | { status: 400 | 401 | 502; body: { error: string } };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidInput(input: LoginRequest): input is Required<LoginRequest> {
  return Boolean(input.email?.trim() && emailPattern.test(input.email.trim()) && input.password);
}

export async function handleLoginUser(
  input: LoginRequest,
  dependencies: { auth: PasswordAuth; supabase: ProfileReader },
): Promise<LoginRouteResult> {
  if (!isValidInput(input)) {
    return {
      status: 400,
      body: { error: 'Enter a valid email and password' },
    };
  }

  const email = input.email.trim().toLowerCase();
  const { data, error } = await dependencies.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error || !data?.user?.id) {
    return {
      status: 401,
      body: { error: error?.message || 'Invalid login credentials' },
    };
  }

  const profile = await dependencies.supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', data.user.id)
    .single();

  if (profile.error) {
    return {
      status: 502,
      body: { error: profile.error.message || 'Unable to load profile' },
    };
  }

  return {
    status: 200,
    body: {
      user: {
        id: data.user.id,
        email: data.user.email || email,
        role: profile.data?.role || 'traveler',
        fullName: profile.data?.full_name || null,
      },
    },
  };
}
