import type { UserRole, VerificationStatus } from '@/src/types/domain';
import { dealModels } from '@/src/features/deals/data';
import {
  buildDefaultVendorAccommodationAccess,
  resolveVendorAccommodationAccess,
  type ApprovalMode,
  type VendorAccessEnforcementMode,
  type VendorPlanTier,
  type VendorProviderFamily,
} from '@/src/features/vendor-os/accommodationAccess';

const ADMIN_AUDIT_PREFIX = '__tripetrip_admin_audit__:';
const ADMIN_CONFIG_PREFIX = '__tripetrip_admin_config__:';
const ADMIN_VENDOR_ACCESS_PREFIX = '__tripetrip_vendor_access__:';
export const DEFAULT_CONTENT_CONFIG = {
  homepageAnnouncement: '',
  featuredVendorSlugs: [] as string[],
  featuredListingIds: [] as string[],
  featuredDealSlugs: ['goa-beach-escape', 'manali-snow-retreat'] as string[],
};
export const DEFAULT_SYSTEM_CONFIG = {
  registrationEnabled: true,
  communityEnabled: true,
  dealsEnabled: true,
  maintenanceMode: false,
};

type SupabaseLike = {
  auth: {
    admin: {
      listUsers: (params?: { page?: number; perPage?: number }) => Promise<{
        data?: {
          users?: Array<Record<string, unknown>>;
          nextPage?: number | null;
          lastPage?: number | null;
        } | null;
        error?: { message?: string } | null;
      }>;
      updateUserById?: (userId: string, attributes: Record<string, unknown>) => Promise<{
        data?: unknown;
        error?: { message?: string } | null;
      }>;
    };
  };
  from: (table: string) => any;
};

type AdminViewer = {
  id: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
};

type AdminActionInput = {
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  details?: Record<string, unknown>;
};

type AdminAuditEntry = AdminActionInput & {
  id: string;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    role: string;
    avatarUrl: string | null;
  };
};

type SiteConfig = {
  content: typeof DEFAULT_CONTENT_CONFIG;
  system: typeof DEFAULT_SYSTEM_CONFIG;
};

type VendorAccommodationAccessRecord = {
  vendorProfileId: string;
  businessType: string;
  providerFamily: VendorProviderFamily;
  planTier: VendorPlanTier;
  enforcementMode: VendorAccessEnforcementMode;
  moduleOverrides: Record<string, boolean>;
  capabilityOverrides: Record<string, boolean>;
  approvalOverrides: Record<string, ApprovalMode>;
  updatedAt?: string;
};

function safeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parsePrefixedJson<T>(value: unknown, prefix: string): T | null {
  if (typeof value !== 'string' || !value.startsWith(prefix)) return null;
  try {
    return JSON.parse(value.slice(prefix.length)) as T;
  } catch {
    return null;
  }
}

function withPrefix(prefix: string, value: unknown) {
  return `${prefix}${JSON.stringify(value)}`;
}

async function countTable(supabase: SupabaseLike, table: string, filter?: { column: string; value: unknown }) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count } = await query;
  return count ?? 0;
}

async function listProfilesByIds(supabase: SupabaseLike, ids: string[]) {
  if (ids.length === 0) return new Map<string, Record<string, unknown>>();
  const { data } = await supabase.from('profiles').select('*').in('id', ids);
  return new Map<string, Record<string, unknown>>((data || []).map((profile: Record<string, unknown>) => [safeString(profile.id), profile]));
}

async function listLatestConfigMessages(supabase: SupabaseLike) {
  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .like('content', `${ADMIN_CONFIG_PREFIX}%`)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data || []) as Array<Record<string, unknown>>;
}

export async function getSiteConfig(supabase: SupabaseLike) {
  const rows = await listLatestConfigMessages(supabase);
  let content = { ...DEFAULT_CONTENT_CONFIG };
  let system = { ...DEFAULT_SYSTEM_CONFIG };

  for (const row of rows) {
    const parsed = parsePrefixedJson<{ key?: 'content' | 'system'; value?: Record<string, unknown> }>(
      row.content,
      ADMIN_CONFIG_PREFIX,
    );
    if (!parsed?.key || !parsed.value) continue;
    if (parsed.key === 'content') {
      content = {
        ...content,
        ...parsed.value,
        featuredVendorSlugs: Array.isArray(parsed.value.featuredVendorSlugs)
          ? parsed.value.featuredVendorSlugs.map((item) => String(item))
          : content.featuredVendorSlugs,
        featuredListingIds: Array.isArray(parsed.value.featuredListingIds)
          ? parsed.value.featuredListingIds.map((item) => String(item))
          : content.featuredListingIds,
        featuredDealSlugs: Array.isArray(parsed.value.featuredDealSlugs)
          ? parsed.value.featuredDealSlugs.map((item) => String(item))
          : content.featuredDealSlugs,
      };
    }

    if (parsed.key === 'system') {
      system = {
        ...system,
        ...parsed.value,
      };
    }
  }

  return { content, system };
}

export async function saveSiteConfig(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  key: 'content' | 'system',
  value: Record<string, unknown>,
) {
  await supabase.from('messages').insert({
    sender_id: viewer.id,
    receiver_id: viewer.id,
    content: withPrefix(ADMIN_CONFIG_PREFIX, { key, value }),
  });
}

export async function logAdminAction(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  input: AdminActionInput,
) {
  await supabase.from('messages').insert({
    sender_id: viewer.id,
    receiver_id: viewer.id,
    content: withPrefix(ADMIN_AUDIT_PREFIX, input),
  });
}

export async function listAdminAuditEntries(supabase: SupabaseLike) {
  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, profiles:sender_id(id, full_name, role, avatar_url)')
    .like('content', `${ADMIN_AUDIT_PREFIX}%`)
    .order('created_at', { ascending: false })
    .limit(100);

  return ((data || []) as Array<Record<string, unknown>>)
    .map((row) => {
      const parsed = parsePrefixedJson<AdminActionInput>(row.content, ADMIN_AUDIT_PREFIX);
      const actor = row.profiles as Record<string, unknown> | undefined;
      if (!parsed) return null;
      return {
        id: safeString(row.id),
        createdAt: safeString(row.created_at),
        ...parsed,
        actor: {
          id: safeString(actor?.id, safeString(row.sender_id)),
          fullName: safeString(actor?.full_name, 'Tripetrip Admin'),
          role: safeString(actor?.role, 'admin'),
          avatarUrl: typeof actor?.avatar_url === 'string' ? actor.avatar_url : null,
        },
      } satisfies AdminAuditEntry;
    })
    .filter((entry): entry is AdminAuditEntry => Boolean(entry));
}

export async function getAdminOverview(supabase: SupabaseLike) {
  const siteConfig = await getSiteConfig(supabase);
  const [users, vendors, activeListings, bookings, manualPayments, auditEntries] = await Promise.all([
    countTable(supabase, 'profiles'),
    countTable(supabase, 'vendor_profiles'),
    countTable(supabase, 'listings', { column: 'is_active', value: true }),
    countTable(supabase, 'bookings'),
    countTable(supabase, 'manual_payment_intents'),
    listAdminAuditEntries(supabase),
  ]);
  const [pendingVendorVerifications, pendingPayments, communityPosts] = await Promise.all([
    countTable(supabase, 'vendor_profiles', { column: 'verification_status', value: 'pending' }),
    countTable(supabase, 'manual_payment_intents', { column: 'admin_approval_status', value: 'pending' }),
    supabase.from('messages').select('*', { count: 'exact', head: true }).like('content', '__tripetrip_community__:%'),
  ]);

  return {
    metrics: {
      users,
      vendors,
      activeListings,
      bookings,
      manualPayments,
      pendingVendorVerifications,
      pendingPayments,
      communityPosts: communityPosts.count ?? 0,
    },
    featureFlags: siteConfig.system,
    recentAdminActions: auditEntries.slice(0, 10),
  };
}

export async function listAdminUsers(supabase: SupabaseLike) {
  let page = 1;
  const allUsers: Array<Record<string, unknown>> = [];

  while (page) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message || 'Unable to list users');
    allUsers.push(...(data?.users || []));
    page = data?.nextPage ?? 0;
  }

  const profileMap = await listProfilesByIds(
    supabase,
    allUsers.map((user) => safeString(user.id)).filter(Boolean),
  );

  return allUsers.map((user) => {
    const id = safeString(user.id);
    const profile = profileMap.get(id);
    return {
      id,
      email: safeString(user.email),
      phone: safeString(profile?.phone ?? user.phone),
      fullName: safeString(profile?.full_name ?? (user.user_metadata as Record<string, unknown> | undefined)?.full_name, 'Unknown User'),
      role: safeString(profile?.role, 'traveler'),
      createdAt: safeString(profile?.created_at ?? user.created_at),
      bannedUntil: safeString(user.banned_until),
      lastSignInAt: safeString(user.last_sign_in_at),
      emailConfirmedAt: safeString(user.email_confirmed_at),
    };
  });
}

export async function updateAdminUser(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  input: {
    userId: string;
    role?: UserRole;
    fullName?: string;
    phone?: string;
    suspend?: boolean;
  },
) {
  const updates: Record<string, unknown> = {};
  if (input.role) updates.role = input.role;
  if (typeof input.fullName === 'string') updates.full_name = input.fullName;
  if (typeof input.phone === 'string') updates.phone = input.phone;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', input.userId);
    if (error) throw new Error(error.message || 'Unable to update user profile');
  }

  if (typeof input.suspend === 'boolean' && supabase.auth.admin.updateUserById) {
    const { error } = await supabase.auth.admin.updateUserById(input.userId, {
      ban_duration: input.suspend ? '876000h' : 'none',
    });
    if (error) throw new Error(error.message || 'Unable to update user access');
  }

  await logAdminAction(supabase, viewer, {
    module: 'users',
    action: 'update',
    entityType: 'profile',
    entityId: input.userId,
    summary: `Updated user ${input.userId}`,
    details: input,
  });
}

export async function listAdminVendors(supabase: SupabaseLike) {
  const { data, error } = await supabase
    .from('vendor_profiles')
    .select('*, profiles:user_id(id, full_name, phone, role)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Unable to list vendor profiles');
  return (data || []).map((vendor: Record<string, unknown>) => ({
    ...vendor,
    profile: vendor.profiles,
  }));
}

export async function updateAdminVendor(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  input: {
    vendorId: string;
    verificationStatus?: VerificationStatus;
    isActive?: boolean;
    businessName?: string;
    businessType?: string;
    slug?: string;
  },
) {
  const updates: Record<string, unknown> = {};
  if (typeof input.verificationStatus === 'string') updates.verification_status = input.verificationStatus;
  if (typeof input.isActive === 'boolean') updates.is_active = input.isActive;
  if (typeof input.businessName === 'string') updates.business_name = input.businessName;
  if (typeof input.businessType === 'string') updates.business_type = input.businessType;
  if (typeof input.slug === 'string') updates.slug = input.slug;

  const { error } = await supabase.from('vendor_profiles').update(updates).eq('id', input.vendorId);
  if (error) throw new Error(error.message || 'Unable to update vendor profile');

  await logAdminAction(supabase, viewer, {
    module: 'vendors',
    action: 'update',
    entityType: 'vendor_profile',
    entityId: input.vendorId,
    summary: `Updated vendor ${input.vendorId}`,
    details: input,
  });
}

export async function listAdminListings(supabase: SupabaseLike) {
  const { data, error } = await supabase
    .from('listings')
    .select('*, vendor_profiles:vendor_id(id, business_name, slug, verification_status, is_active)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Unable to list listings');
  return data || [];
}

export async function updateAdminListing(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  input: {
    listingId: string;
    isActive?: boolean;
    title?: string;
    category?: string;
    basePrice?: number;
  },
) {
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof input.isActive === 'boolean') updates.is_active = input.isActive;
  if (typeof input.title === 'string') updates.title = input.title;
  if (typeof input.category === 'string') updates.category = input.category;
  if (typeof input.basePrice === 'number') updates.base_price = input.basePrice;

  const { error } = await supabase.from('listings').update(updates).eq('id', input.listingId);
  if (error) throw new Error(error.message || 'Unable to update listing');

  await logAdminAction(supabase, viewer, {
    module: 'listings',
    action: 'update',
    entityType: 'listing',
    entityId: input.listingId,
    summary: `Updated listing ${input.listingId}`,
    details: input,
  });
}

export async function listAdminBookings(supabase: SupabaseLike) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, listings:listing_id(id, title, category), vendor_profiles:vendor_id(id, business_name), profiles:traveler_id(id, full_name, phone)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message || 'Unable to list bookings');
  return data || [];
}

export async function updateAdminBooking(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  input: {
    bookingId: string;
    status?: string;
    paymentStatus?: string;
  },
) {
  const updates: Record<string, unknown> = {};
  if (typeof input.status === 'string') updates.status = input.status;
  if (typeof input.paymentStatus === 'string') updates.payment_status = input.paymentStatus;

  const { error } = await supabase.from('bookings').update(updates).eq('id', input.bookingId);
  if (error) throw new Error(error.message || 'Unable to update booking');

  await logAdminAction(supabase, viewer, {
    module: 'bookings',
    action: 'update',
    entityType: 'booking',
    entityId: input.bookingId,
    summary: `Updated booking ${input.bookingId}`,
    details: input,
  });
}

export async function listAdminCommunityPosts(supabase: SupabaseLike) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at, profiles:sender_id(id, full_name, role, avatar_url)')
    .like('content', '__tripetrip_community__:%')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message || 'Unable to list community posts');
  return data || [];
}

export async function removeAdminCommunityPost(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  postId: string,
) {
  const { error } = await supabase.from('messages').delete().eq('id', postId);
  if (error) throw new Error(error.message || 'Unable to remove community post');

  await logAdminAction(supabase, viewer, {
    module: 'community',
    action: 'delete',
    entityType: 'community_post',
    entityId: postId,
    summary: `Removed community post ${postId}`,
  });
}

export async function getAdminSystemState(supabase: SupabaseLike, configHealth: unknown) {
  const siteConfig = await getSiteConfig(supabase);
  const overview = await getAdminOverview(supabase);
  return {
    configHealth,
    siteConfig,
    health: {
      users: overview.metrics.users,
      activeListings: overview.metrics.activeListings,
      pendingPayments: overview.metrics.pendingPayments,
      pendingVendorVerifications: overview.metrics.pendingVendorVerifications,
    },
  };
}

export function listAdminDeals() {
  return dealModels.map((deal) => ({
    ...deal,
    salesVelocity: deal.bookingCount > 0 ? Math.round((deal.bookingCount / Math.max(deal.maxBookings, 1)) * 100) : 0,
  }));
}

export function getAdminContentPreview(config: SiteConfig['content']) {
  return {
    announcement: config.homepageAnnouncement,
    featuredDeals: dealModels.filter((deal) => config.featuredDealSlugs.includes(deal.slug)),
    featuredVendorSlugs: config.featuredVendorSlugs,
    featuredListingIds: config.featuredListingIds,
  };
}

async function listLatestVendorAccessMessages(supabase: SupabaseLike) {
  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .like('content', `${ADMIN_VENDOR_ACCESS_PREFIX}%`)
    .order('created_at', { ascending: false })
    .limit(200);

  return (data || []) as Array<Record<string, unknown>>;
}

export async function listAdminAccommodationAccess(supabase: SupabaseLike) {
  const vendors = await listAdminVendors(supabase);
  const rows = await listLatestVendorAccessMessages(supabase);
  const latestByVendor = new Map<string, VendorAccommodationAccessRecord>();

  for (const row of rows) {
    const parsed = parsePrefixedJson<VendorAccommodationAccessRecord>(row.content, ADMIN_VENDOR_ACCESS_PREFIX);
    if (!parsed?.vendorProfileId || latestByVendor.has(parsed.vendorProfileId)) continue;
    latestByVendor.set(parsed.vendorProfileId, parsed);
  }

  return vendors.map((vendor) => {
    const vendorId = safeString(vendor.id);
    const businessType = safeString(vendor.business_type);
    const saved = latestByVendor.get(vendorId);
    const base = saved || buildDefaultVendorAccommodationAccess({ vendorProfileId: vendorId, businessType });
    const resolved = resolveVendorAccommodationAccess({
      ...base,
      businessType,
      providerFamily: saved?.providerFamily || buildDefaultVendorAccommodationAccess({ vendorProfileId: vendorId, businessType }).providerFamily,
    });

    return {
      vendorId,
      businessName: safeString(vendor.business_name),
      businessType,
      slug: safeString(vendor.slug),
      isActive: Boolean(vendor.is_active),
      verificationStatus: safeString(vendor.verification_status),
      profile: vendor.profile || vendor.profiles || null,
      access: resolved,
    };
  });
}

export async function getVendorAccommodationAccess(
  supabase: SupabaseLike,
  input: { organizationId?: string | null; userId?: string | null },
) {
  let vendor: Record<string, unknown> | null = null;

  if (input.organizationId) {
    const { data } = await supabase
      .from('vendor_organizations')
      .select('id, primary_vendor_profile_id')
      .eq('id', input.organizationId)
      .maybeSingle();

    const vendorProfileId = safeString(data?.primary_vendor_profile_id);
    if (vendorProfileId) {
      const vendorResult = await supabase.from('vendor_profiles').select('*').eq('id', vendorProfileId).maybeSingle();
      vendor = (vendorResult.data as Record<string, unknown> | null) || null;
    }
  }

  if (!vendor && input.userId) {
    const vendorResult = await supabase.from('vendor_profiles').select('*').eq('user_id', input.userId).maybeSingle();
    vendor = (vendorResult.data as Record<string, unknown> | null) || null;
  }

  if (!vendor) return null;

  const vendorId = safeString(vendor.id);
  const businessType = safeString(vendor.business_type);
  const rows = await listLatestVendorAccessMessages(supabase);
  const saved = rows
    .map((row) => parsePrefixedJson<VendorAccommodationAccessRecord>(row.content, ADMIN_VENDOR_ACCESS_PREFIX))
    .find((entry) => entry?.vendorProfileId === vendorId);

  return resolveVendorAccommodationAccess(
    saved || buildDefaultVendorAccommodationAccess({ vendorProfileId: vendorId, businessType }),
  );
}

export async function saveAdminAccommodationAccess(
  supabase: SupabaseLike,
  viewer: AdminViewer,
  input: {
    vendorProfileId: string;
    businessType: string;
    providerFamily?: VendorProviderFamily;
    planTier?: VendorPlanTier;
    enforcementMode?: VendorAccessEnforcementMode;
    moduleOverrides?: Record<string, boolean>;
    capabilityOverrides?: Record<string, boolean>;
    approvalOverrides?: Record<string, ApprovalMode>;
  },
) {
  const current = buildDefaultVendorAccommodationAccess({
    vendorProfileId: input.vendorProfileId,
    businessType: input.businessType,
  });

  const payload: VendorAccommodationAccessRecord = {
    vendorProfileId: input.vendorProfileId,
    businessType: input.businessType,
    providerFamily: input.providerFamily || current.providerFamily,
    planTier: input.planTier || current.planTier,
    enforcementMode: input.enforcementMode || current.enforcementMode,
    moduleOverrides: input.moduleOverrides || {},
    capabilityOverrides: input.capabilityOverrides || {},
    approvalOverrides: input.approvalOverrides || {},
    updatedAt: new Date().toISOString(),
  };

  await supabase.from('messages').insert({
    sender_id: viewer.id,
    receiver_id: viewer.id,
    content: withPrefix(ADMIN_VENDOR_ACCESS_PREFIX, payload),
  });

  await logAdminAction(supabase, viewer, {
    module: 'accommodation_access',
    action: 'update',
    entityType: 'vendor_accommodation_access',
    entityId: input.vendorProfileId,
    summary: `Updated accommodation access for vendor ${input.vendorProfileId}`,
    details: payload as unknown as Record<string, unknown>,
  });

  return resolveVendorAccommodationAccess(payload);
}
