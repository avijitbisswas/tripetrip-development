import { describe, expect, it, vi } from 'vitest';
import { handleRegisterUser } from './registerRoute';

describe('registration route handler', () => {
  it('creates a confirmed traveler profile through the server auth client', async () => {
    const adminAuth = {
      createUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } }, error: null })),
      deleteUser: vi.fn(),
    };
    const tables: Record<string, unknown[]> = {};
    const supabase = createSupabaseMock(tables);

    const result = await handleRegisterUser(
      {
        email: 'qa.traveler@gmail.com',
        password: 'TestPass123!',
        fullName: 'QA Traveler',
        role: 'traveler',
      },
      { adminAuth, supabase },
    );

    expect(result).toEqual({
      status: 200,
      body: {
        user: {
          id: 'user-1',
          role: 'traveler',
          fullName: 'QA Traveler',
        },
      },
    });
    expect(adminAuth.createUser).toHaveBeenCalledWith({
      email: 'qa.traveler@gmail.com',
      password: 'TestPass123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'QA Traveler',
        role: 'traveler',
      },
    });
    expect(tables.profiles).toEqual([
      {
        id: 'user-1',
        role: 'traveler',
        full_name: 'QA Traveler',
        phone: null,
      },
    ]);
  });

  it('creates a vendor profile when registering as a vendor', async () => {
    const adminAuth = {
      createUser: vi.fn(async () => ({ data: { user: { id: 'abcd-1234' } }, error: null })),
      deleteUser: vi.fn(),
    };
    const tables: Record<string, unknown[]> = {};
    const supabase = createSupabaseMock(tables);

    const result = await handleRegisterUser(
      {
        email: 'qa.vendor@gmail.com',
        password: 'TestPass123!',
        fullName: 'Goa Luxe',
        role: 'vendor',
      },
      { adminAuth, supabase },
    );

    expect(result.status).toBe(200);
    expect(tables.vendor_profiles).toEqual([
      expect.objectContaining({
        user_id: 'abcd-1234',
        business_name: "Goa Luxe's Travel Services",
        business_type: 'stays',
        slug: 'goa-luxe-s-travel-services-abcd',
      }),
    ]);
  });

  it('returns validation errors before creating users', async () => {
    const adminAuth = {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    };

    const result = await handleRegisterUser(
      {
        email: 'bad',
        password: 'short',
        fullName: '',
        role: 'vendor',
      },
      { adminAuth, supabase: createSupabaseMock({}) },
    );

    expect(result).toEqual({
      status: 400,
      body: { error: 'Enter a valid name, email, password, and account type' },
    });
    expect(adminAuth.createUser).not.toHaveBeenCalled();
  });

  it('deletes the auth user if vendor profile creation fails', async () => {
    const adminAuth = {
      createUser: vi.fn(async () => ({ data: { user: { id: 'user-rollback' } }, error: null })),
      deleteUser: vi.fn(async () => ({ error: null })),
    };
    const supabase = createSupabaseMock({}, { failTable: 'vendor_profiles' });

    const result = await handleRegisterUser(
      {
        email: 'qa.vendor@gmail.com',
        password: 'TestPass123!',
        fullName: 'QA Vendor',
        role: 'vendor',
      },
      { adminAuth, supabase },
    );

    expect(result).toEqual({
      status: 502,
      body: { error: 'Unable to create vendor account' },
    });
    expect(adminAuth.deleteUser).toHaveBeenCalledWith('user-rollback');
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
