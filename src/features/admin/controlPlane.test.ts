import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAdminAccommodationAccess, listAdminMarketplaceSyncs, saveAdminAccommodationAccess, updateAdminMarketplaceSync } from './controlPlane';

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
                    capabilityOverrides: {
                      'guest.whatsapp_automation': true,
                      'bookings.rate_plan_controls': false,
                      'billing.night_audit': false,
                    },
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
      capabilityOverrides: {
        'guest.whatsapp_automation': true,
        'bookings.rate_plan_controls': false,
        'billing.night_audit': false,
      },
      resolvedCapabilities: expect.objectContaining({
        'guest.whatsapp_automation': true,
        'bookings.rate_plan_controls': false,
        'billing.night_audit': false,
      }),
    });
  });

  it('lists marketplace sync records for admin publishing review', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'vendor_marketplace_syncs') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(async () => ({
                data: [
                  {
                    id: 'sync-1',
                    organization_id: 'org-1',
                    sync_status: 'pending_approval',
                    metadata: { listing_title: 'Private Villa Goa' },
                  },
                ],
                error: null,
              })),
            })),
          };
        }

        return {};
      }),
    };

    await expect(listAdminMarketplaceSyncs(supabase as never)).resolves.toEqual([
      expect.objectContaining({
        id: 'sync-1',
        sync_status: 'pending_approval',
      }),
    ]);
  });

  it('approves marketplace sync records using the requested publish state', async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'vendor_marketplace_syncs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    metadata: {
                      requested_listing_state: 'live',
                      requested_sync_status: 'synced',
                      listing_state: 'pending_approval',
                      approval_status: 'pending',
                      channel_targets: ['tripetrip', 'booking_request'],
                    },
                  },
                  error: null,
                })),
              })),
            })),
            update,
          };
        }

        if (table === 'messages') {
          return { insert };
        }

        return {};
      }),
    };

    await updateAdminMarketplaceSync(supabase as never, viewer, {
      syncId: 'sync-1',
      approvalStatus: 'approved',
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        sync_status: 'synced',
        last_synced_at: expect.any(String),
        metadata: expect.objectContaining({
          listing_state: 'live',
          approval_status: 'approved',
          approved_by: 'Tripetrip Admin',
          channel_distribution: {
            tripetrip: { status: 'live', mode: 'direct' },
            booking_request: { status: 'request_only', mode: 'request' },
          },
        }),
      }),
    );
  });
});
