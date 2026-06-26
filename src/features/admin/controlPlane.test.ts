import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAdminAccommodationAccess, saveAdminAccommodationAccess } from './controlPlane';

function createMessagesQuery(rows: Array<Record<string, unknown>>) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(() => query),
    like: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(async () => ({ data: rows, error: null })),
  };

  query.then = vi.fn((resolve: (value: unknown) => unknown) =>
    Promise.resolve(resolve({ data: rows, error: null })),
  );

  return query;
}

describe('admin accommodation control plane', () => {
  const insert = vi.fn();
  const viewer = {
    id: 'admin-1',
    fullName: 'Tripetrip Admin',
    role: 'admin' as const,
    avatarUrl: null,
  };

  beforeEach(() => {
    insert.mockReset();
    insert.mockResolvedValue({ data: {}, error: null });
  });

  it('preserves existing module, capability, and approval overrides when an admin updates only the plan tier', async () => {
    const existingAccess = {
      vendorProfileId: 'vendor-1',
      businessType: 'hotel',
      providerFamily: 'accommodation',
      planTier: 'basic',
      enforcementMode: 'enforced',
      moduleOverrides: { team: false },
      capabilityOverrides: { 'staff.shift_scheduling': true },
      approvalOverrides: { pricing_changes: 'vendor_owner_only' },
      updatedAt: '2026-06-26T10:00:00.000Z',
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'messages') {
          return {
            select: vi.fn(() =>
              createMessagesQuery([
                {
                  id: 'msg-1',
                  sender_id: 'admin-1',
                  content: `__tripetrip_vendor_access__:${JSON.stringify(existingAccess)}`,
                  created_at: '2026-06-26T10:00:00.000Z',
                },
              ]),
            ),
            insert,
          };
        }

        return {};
      }),
    };

    await saveAdminAccommodationAccess(supabase as never, viewer, {
      vendorProfileId: 'vendor-1',
      businessType: 'hotel',
      planTier: 'paid',
    });

    const firstInsertPayload = insert.mock.calls[0]?.[0] as Record<string, unknown>;
    const content = String(firstInsertPayload.content || '');
    const saved = JSON.parse(content.replace('__tripetrip_vendor_access__:', '')) as Record<string, unknown>;

    expect(saved).toMatchObject({
      vendorProfileId: 'vendor-1',
      businessType: 'hotel',
      providerFamily: 'accommodation',
      planTier: 'paid',
      enforcementMode: 'enforced',
      moduleOverrides: { team: false },
      capabilityOverrides: { 'staff.shift_scheduling': true },
      approvalOverrides: { pricing_changes: 'vendor_owner_only' },
    });
  });

  it('returns saved capability overrides to the admin listing response', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'vendor_profiles') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(async () => ({
                data: [
                  {
                    id: 'vendor-1',
                    business_name: 'Manali Peaks',
                    business_type: 'hotel',
                    slug: 'manali-peaks',
                    is_active: true,
                    verification_status: 'verified',
                    profile: null,
                  },
                ],
                error: null,
              })),
            })),
          };
        }

        if (table === 'messages') {
          return {
            select: vi.fn(() =>
              createMessagesQuery([
                {
                  id: 'msg-1',
                  sender_id: 'admin-1',
                  content: `__tripetrip_vendor_access__:${JSON.stringify({
                    vendorProfileId: 'vendor-1',
                    businessType: 'hotel',
                    providerFamily: 'accommodation',
                    planTier: 'paid',
                    enforcementMode: 'enforced',
                    moduleOverrides: {},
                    capabilityOverrides: { 'guest.whatsapp_automation': true },
                    approvalOverrides: {},
                    updatedAt: '2026-06-26T10:00:00.000Z',
                  })}`,
                  created_at: '2026-06-26T10:00:00.000Z',
                },
              ]),
            ),
          };
        }

        return {};
      }),
      auth: {
        admin: {
          listUsers: vi.fn(),
        },
      },
    };

    const vendors = await listAdminAccommodationAccess(supabase as never);

    expect(vendors[0]?.access).toMatchObject({
      capabilityOverrides: { 'guest.whatsapp_automation': true },
      resolvedCapabilities: expect.objectContaining({ 'guest.whatsapp_automation': true }),
    });
  });
});
