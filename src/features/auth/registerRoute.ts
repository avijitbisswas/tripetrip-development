type RegisterRole = 'traveler' | 'vendor';

type RegisterRequest = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
};

type AdminAuth = {
  createUser: (input: {
    email: string;
    password: string;
    email_confirm: boolean;
    user_metadata: { full_name: string; role: RegisterRole };
  }) => Promise<{ data: { user: { id: string } | null } | null; error: { message?: string } | null }>;
  deleteUser: (userId: string) => Promise<unknown>;
};

type SupabaseWriter = {
  from: (table: string) => {
    upsert: (
      row: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => {
      select: () => {
        single: () => Promise<{ data: unknown; error: { message?: string } | null }>;
      };
    };
  };
};

export type RegisterRouteResult =
  | { status: 200; body: { user: { id: string; role: RegisterRole; fullName: string } } }
  | { status: 400 | 502; body: { error: string } };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRegisterRole(role: string | undefined): role is RegisterRole {
  return role === 'traveler' || role === 'vendor';
}

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function isValidInput(input: RegisterRequest): input is Required<RegisterRequest> & { role: RegisterRole } {
  return Boolean(
    input.fullName?.trim() &&
      input.email?.trim() &&
      emailPattern.test(input.email.trim()) &&
      input.password &&
      input.password.length >= 6 &&
      isRegisterRole(input.role),
  );
}

export async function handleRegisterUser(
  input: RegisterRequest,
  dependencies: { adminAuth: AdminAuth; supabase: SupabaseWriter },
): Promise<RegisterRouteResult> {
  if (!isValidInput(input)) {
    return {
      status: 400,
      body: { error: 'Enter a valid name, email, password, and account type' },
    };
  }

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const role = input.role;
  let userId: string | null = null;

  try {
    const { data, error } = await dependencies.adminAuth.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    });

    if (error || !data?.user?.id) {
      return {
        status: 502,
        body: { error: error?.message || 'Unable to create account' },
      };
    }

    userId = data.user.id;
    const profileWrite = await dependencies.supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          role,
          full_name: fullName,
          phone: null,
        },
        { onConflict: 'id' },
      )
      .select()
      .single();

    if (profileWrite.error) {
      throw new Error(profileWrite.error.message || 'Profile write failed');
    }

    if (role === 'vendor') {
      const businessName = `${fullName}'s Travel Services`;
      const vendorWrite = await dependencies.supabase
        .from('vendor_profiles')
        .upsert(
          {
            user_id: userId,
            business_name: businessName,
            business_type: 'stays',
            slug: `${generateSlug(businessName)}-${userId.slice(0, 4)}`,
          },
          { onConflict: 'user_id' },
        )
        .select()
        .single();

      if (vendorWrite.error) {
        throw new Error(vendorWrite.error.message || 'Vendor profile write failed');
      }
    }

    return {
      status: 200,
      body: {
        user: {
          id: userId,
          role,
          fullName,
        },
      },
    };
  } catch {
    if (userId) {
      await dependencies.adminAuth.deleteUser(userId).catch(() => undefined);
    }

    return {
      status: 502,
      body: { error: 'Unable to create vendor account' },
    };
  }
}
