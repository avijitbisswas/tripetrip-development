import { createClient } from "@supabase/supabase-js";
import {
  buildVendorAIBriefPrompt,
  normalizeVendorAIBrief,
} from "../src/features/vendor-os/aiProvider";
import { buildManualPaymentIntent } from "../src/features/payments/manualPayment";
import {
  createManualPaymentRepository,
  type ManualPaymentSupabaseClient,
} from "../src/features/payments/manualPaymentRepository";
import {
  createDealBookingRepository,
  type DealBookingSupabaseClient,
} from "../src/features/deals/dealBookingRepository";
import { handleCreateDealBooking } from "../src/features/deals/dealBookingRoute";
import {
  createDealInventoryRepository,
  type DealInventorySupabaseClient,
} from "../src/features/deals/dealInventory";
import { handleLoginUser } from "../src/features/auth/loginRoute";
import {
  handleRequestPasswordResetOtp,
  handleRequestRegistrationOtp,
  handleResetPasswordWithOtp,
  handleVerifyRegistrationOtp,
} from "../src/features/auth/otpFlow";
import { handleRegisterUser } from "../src/features/auth/registerRoute";
import {
  buildOtpEmailHtml,
  createEncryptedChallengeToken,
  findUserByEmail,
  verifyEncryptedChallengeToken,
} from "../src/features/auth/otpSupport";
import {
  DEFAULT_CONTENT_CONFIG,
  DEFAULT_SYSTEM_CONFIG,
  getVendorAccommodationAccess,
  getAdminContentPreview,
  listAdminAccommodationAccess,
  getAdminOverview,
  getAdminSystemState,
  getSiteConfig,
  listAdminAuditEntries,
  listAdminBookings,
  listAdminCommunityPosts,
  listAdminDeals,
  listAdminListings,
  listAdminUsers,
  listAdminVendors,
  logAdminAction,
  removeAdminCommunityPost,
  saveSiteConfig,
  saveAdminAccommodationAccess,
  updateAdminBooking,
  updateAdminListing,
  updateAdminUser,
  updateAdminVendor,
} from "../src/features/admin/controlPlane";
import { getVendorOSOperation } from "../src/features/vendor-os/operations";

type AssetsBinding = {
  fetch: (request: Request) => Promise<Response>;
};

export type WorkerEnv = {
  ASSETS: AssetsBinding;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  SUPABASE_PROJECT_REF?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
  NOMINATIM_BASE_URL?: string;
  VITE_NOMINATIM_BASE_URL?: string;
  MAP_STYLE_URL?: string;
  VITE_MAP_STYLE_URL?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_UPLOAD_FOLDER?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  AUTH_OTP_SECRET?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  MANUAL_PAYMENT_UPI_ID?: string;
  TRIPETRIP_UPI_ID?: string;
};

type ServerSupabaseClient = ManualPaymentSupabaseClient &
  DealBookingSupabaseClient &
  DealInventorySupabaseClient & {
    auth: {
      signInWithPassword: Parameters<typeof handleLoginUser>[1]["auth"]["signInWithPassword"];
      admin: Parameters<typeof handleRegisterUser>[1]["adminAuth"] & {
        listUsers: (params?: { page?: number; perPage?: number }) => Promise<{
          data?: {
            users?: Array<{ id: string; email?: string | null }>;
            nextPage?: number | null;
            lastPage?: number | null;
          } | null;
          error?: { message?: string } | null;
        }>;
        updateUserById: (
          userId: string,
          attributes: { password: string; email_confirm: boolean },
        ) => Promise<{
          data?: { user: { id: string } | null } | null;
          error?: { message?: string } | null;
        }>;
      };
      getUser: (token: string) => Promise<{
        data: { user: { id: string } | null } | null;
        error: { message?: string } | null;
      }>;
    };
    from: (table: string) => unknown;
  };

type VendorPmsResource = "room_types" | "rooms" | "reservations" | "housekeeping" | "folios";
type VendorAccountingResource = "payments";

const vendorPmsResources: Record<
  VendorPmsResource,
  {
    table: string;
    branchScoped: boolean;
    orderBy: string;
  }
> = {
  room_types: {
    table: "vendor_room_types",
    branchScoped: false,
    orderBy: "created_at",
  },
  rooms: {
    table: "vendor_rooms",
    branchScoped: false,
    orderBy: "created_at",
  },
  reservations: {
    table: "vendor_pms_reservations",
    branchScoped: true,
    orderBy: "check_in_date",
  },
  housekeeping: {
    table: "vendor_housekeeping_tasks",
    branchScoped: false,
    orderBy: "due_at",
  },
  folios: {
    table: "vendor_folio_entries",
    branchScoped: true,
    orderBy: "posted_at",
  },
};

const vendorAccountingResources: Record<
  VendorAccountingResource,
  {
    table: string;
    branchScoped: boolean;
    orderBy: string;
  }
> = {
  payments: {
    table: "vendor_payment_records",
    branchScoped: true,
    orderBy: "collected_at",
  },
};

const CONFIG_HEALTH_VERSION = "2026-06-15";
const COMMUNITY_MESSAGE_PREFIX = "__tripetrip_community__:";
const COMMUNITY_AUDIENCES = new Set(["everyone", "circle", "mentions"]);
const COMMUNITY_VISIBILITIES = new Set(["feed", "profile"]);

type CommunityMessagePayload = {
  role: string;
  content: string;
  audience?: "everyone" | "circle" | "mentions";
  visibility?: "feed" | "profile";
  location?: string | null;
  scheduledAt?: string | null;
  important?: boolean;
  media?: {
    type: "image" | "gif";
    url: string;
    alt?: string;
  } | null;
  poll?: {
    options: string[];
  } | null;
};

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

function resolvePublicSupabaseUrl(env: WorkerEnv) {
  const projectRef = env.SUPABASE_PROJECT_REF?.trim();
  return (
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    (projectRef ? `https://${projectRef}.supabase.co` : undefined)
  );
}

function getRuntimeConfigScript(env: WorkerEnv) {
  const supabaseUrl = resolvePublicSupabaseUrl(env);
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const config = {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
  };
  const serialized = JSON.stringify(config).replace(/</g, "\\u003c");

  return `<script>window.__TRIPETRIP_CONFIG__=${serialized};</script>`;
}

async function injectRuntimeConfig(response: Response, env: WorkerEnv) {
  const contentType = response.headers.get("Content-Type") || "";
  const runtimeConfigScript = getRuntimeConfigScript(env);

  if (!runtimeConfigScript || !contentType.toLowerCase().includes("text/html")) {
    return response;
  }

  const html = await response.text();
  const body = html.includes("</head>")
    ? html.replace("</head>", `${runtimeConfigScript}</head>`)
    : `${runtimeConfigScript}${html}`;
  const headers = new Headers(response.headers);
  headers.delete("Content-Length");

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readJsonBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return {};
  return request.json().catch(() => ({}));
}

function createServerSupabaseClient(env: WorkerEnv) {
  const projectRef = env.SUPABASE_PROJECT_REF?.trim();
  const supabaseUrl = resolvePublicSupabaseUrl(env);
  const supabaseServiceKey =
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return null;

  const typedCreateClient = createClient as unknown as (
    url: string,
    key: string,
    options: { auth: { persistSession: boolean; autoRefreshToken: boolean } },
  ) => ServerSupabaseClient;

  return typedCreateClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function createRepositories(env: WorkerEnv) {
  const supabase = createServerSupabaseClient(env);
  return {
    supabase,
    paymentRepository: createManualPaymentRepository({ supabase }),
    bookingRepository: createDealBookingRepository({ supabase }),
    inventoryRepository: createDealInventoryRepository({ supabase }),
  };
}

function getOtpSecret(env: WorkerEnv) {
  return (
    env.AUTH_OTP_SECRET ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    null
  );
}

async function sendOtpEmail(
  env: WorkerEnv,
  input: { to: string; otp: string; purpose: "register" | "reset-password"; fullName?: string },
) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    throw new Error("Email is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject:
        input.purpose === "register"
          ? "Your Tripetrip verification code"
          : "Your Tripetrip password reset code",
      html: buildOtpEmailHtml(input),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    throw new Error(payload.message || payload.error || "Unable to send OTP email");
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function mapCommunityPost(row: Record<string, unknown>) {
  const author = row.profiles as
    | {
        id?: string;
        full_name?: string | null;
        role?: string;
        avatar_url?: string | null;
      }
    | undefined;

  return {
    id: String(row.id),
    authorId: String(row.author_id),
    role: String(row.role),
    content: String(row.content || ""),
    createdAt: String(row.created_at || ""),
    author: {
      id: String(author?.id || row.author_id),
      fullName: author?.full_name || "Tripetrip Member",
      role: String(author?.role || row.role),
      avatarUrl: author?.avatar_url || null,
    },
  };
}

function normalizeCommunityPayload(input: Partial<CommunityMessagePayload>) {
  const content = String(input.content || "").trim();
  const role = String(input.role || "").trim();
  const audience = COMMUNITY_AUDIENCES.has(String(input.audience))
    ? (String(input.audience) as CommunityMessagePayload["audience"])
    : "everyone";
  const visibility = COMMUNITY_VISIBILITIES.has(String(input.visibility))
    ? (String(input.visibility) as CommunityMessagePayload["visibility"])
    : "feed";
  const location = String(input.location || "").trim();
  const scheduledAtValue = String(input.scheduledAt || "").trim();
  const scheduledAt =
    scheduledAtValue && !Number.isNaN(new Date(scheduledAtValue).getTime())
      ? new Date(scheduledAtValue).toISOString()
      : null;
  const media =
    input.media &&
    (input.media.type === "image" || input.media.type === "gif") &&
    typeof input.media.url === "string" &&
    input.media.url.trim()
      ? {
          type: input.media.type,
          url: input.media.url.trim(),
          ...(typeof input.media.alt === "string" && input.media.alt.trim()
            ? { alt: input.media.alt.trim() }
            : {}),
        }
      : null;
  const pollOptions = Array.isArray(input.poll?.options)
    ? input.poll.options
        .map((option) => String(option || "").trim())
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const poll = pollOptions.length >= 2 ? { options: pollOptions } : null;

  return {
    role,
    content,
    audience,
    visibility,
    ...(location ? { location } : {}),
    ...(scheduledAt ? { scheduledAt } : {}),
    ...(input.important ? { important: true } : {}),
    ...(media ? { media } : {}),
    ...(poll ? { poll } : {}),
  };
}

function encodeCommunityMessage(payload: CommunityMessagePayload) {
  return `${COMMUNITY_MESSAGE_PREFIX}${JSON.stringify(normalizeCommunityPayload(payload))}`;
}

function parseCommunityMessage(value: unknown) {
  if (typeof value !== "string" || !value.startsWith(COMMUNITY_MESSAGE_PREFIX)) {
    return null;
  }

  try {
    const parsed = JSON.parse(value.slice(COMMUNITY_MESSAGE_PREFIX.length)) as Partial<CommunityMessagePayload>;
    const normalized = normalizeCommunityPayload(parsed);
    if (!normalized.role || !normalized.content) return null;
    return normalized;
  } catch {
    return null;
  }
}

function mapCommunityMessage(row: Record<string, unknown>) {
  const parsed = parseCommunityMessage(row.content);
  const author = row.profiles as
    | {
        id?: string;
        full_name?: string | null;
        role?: string;
        avatar_url?: string | null;
      }
    | undefined;

  if (!parsed) return null;

  return {
    id: String(row.id),
    authorId: String(row.sender_id),
    role: parsed.role,
    content: parsed.content,
    createdAt: String(row.created_at || ""),
    audience: parsed.audience,
    visibility: parsed.visibility,
    location: parsed.location || null,
    scheduledAt: parsed.scheduledAt || null,
    important: Boolean(parsed.important),
    media: parsed.media || null,
    poll: parsed.poll || null,
    author: {
      id: String(author?.id || row.sender_id),
      fullName: author?.full_name || "Tripetrip Member",
      role: String(author?.role || parsed.role),
      avatarUrl: author?.avatar_url || null,
    },
  };
}

async function getAuthenticatedProfile(request: Request, env: WorkerEnv) {
  const token = getBearerToken(request);
  if (!token) return { error: json({ error: "Authentication required" }, { status: 401 }) };

  const { supabase } = createRepositories(env);
  if (!supabase) {
    return {
      error: json({ error: "Community service is not configured" }, { status: 503 }),
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const userId = userData?.user?.id;

  if (userError || !userId) {
    return { error: json({ error: "Authentication required" }, { status: 401 }) };
  }

  const profileQuery = (
    supabase.from("profiles") as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{
            data: {
              id: string;
              full_name: string | null;
              role: "traveler" | "vendor" | "admin";
              avatar_url: string | null;
            } | null;
            error: { message?: string } | null;
          }>;
        };
      };
    }
  )
    .select("id, full_name, role, avatar_url")
    .eq("id", userId);

  const { data: profile, error: profileError } = await profileQuery.single();

  if (profileError || !profile) {
    return { error: json({ error: "Profile not found" }, { status: 404 }) };
  }

  return {
    supabase,
    token,
    profile: {
      id: profile.id,
      fullName: profile.full_name || "Tripetrip Member",
      role: profile.role,
      avatarUrl: profile.avatar_url || null,
    },
  };
}

async function getAuthenticatedAdmin(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth;
  if (auth.profile.role !== "admin") {
    return { error: json({ error: "Admin access required" }, { status: 403 }) };
  }

  return auth;
}

function getConfigHealth(env: WorkerEnv) {
  const hasSupabaseUrl = Boolean(
    env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_PROJECT_REF,
  );
  const hasSupabaseServiceKey = Boolean(
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY,
  );
  const hasCloudinaryName = Boolean(
    env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  );
  const hasCloudinaryApiKey = Boolean(env.CLOUDINARY_API_KEY);
  const hasCloudinaryApiSecret = Boolean(env.CLOUDINARY_API_SECRET);
  const hasResendApiKey = Boolean(env.RESEND_API_KEY);
  const hasResendFromEmail = Boolean(env.RESEND_FROM_EMAIL);
  const hasGeminiApiKey = Boolean(env.GEMINI_API_KEY);
  const hasManualPaymentUpi = Boolean(
    env.MANUAL_PAYMENT_UPI_ID || env.TRIPETRIP_UPI_ID,
  );

  return {
    status: "ok",
    version: CONFIG_HEALTH_VERSION,
    supabase: {
      configured: hasSupabaseUrl && hasSupabaseServiceKey,
      url: hasSupabaseUrl,
      serviceKey: hasSupabaseServiceKey,
    },
    cloudinary: {
      configured:
        hasCloudinaryName && hasCloudinaryApiKey && hasCloudinaryApiSecret,
      cloudName: hasCloudinaryName,
      apiKey: hasCloudinaryApiKey,
      apiSecret: hasCloudinaryApiSecret,
    },
    email: {
      configured: hasResendApiKey && hasResendFromEmail,
      resendApiKey: hasResendApiKey,
      resendFromEmail: hasResendFromEmail,
    },
    ai: {
      configured: hasGeminiApiKey,
      geminiApiKey: hasGeminiApiKey,
    },
    payments: {
      configured: hasManualPaymentUpi,
      manualPaymentUpi: hasManualPaymentUpi,
    },
  };
}

async function handleListCommunityPosts(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);
  if (supabase) {
    const siteConfig = await getSiteConfig(supabase);
    if (!siteConfig.system.communityEnabled) {
      return json({ error: "Community is temporarily disabled" }, { status: 403 });
    }
  }

  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const authorId = url.searchParams.get("authorId");
  let query = (
    auth.supabase.from("messages") as unknown as {
      select: (columns: string) => unknown;
    }
  ).select(
    "id, sender_id, content, created_at, profiles:sender_id(id, full_name, role, avatar_url)",
  ) as {
    eq: (column: string, value: string) => unknown;
    like: (column: string, value: string) => unknown;
    order: (column: string, options: { ascending: boolean }) => unknown;
    limit: (count: number) => Promise<{
      data: Array<Record<string, unknown>> | null;
      error: { message?: string } | null;
    }>;
  };

  query = query.like("content", `${COMMUNITY_MESSAGE_PREFIX}%`) as typeof query;
  if (authorId) query = query.eq("sender_id", authorId) as typeof query;
  query = query.order("created_at", { ascending: false }) as typeof query;

  const { data, error } = await query.limit(50);

  if (error) {
    return json({ error: error.message || "Unable to load community feed" }, { status: 502 });
  }

  const now = Date.now();
  return json({
    viewer: auth.profile,
    posts: (data || [])
      .map(mapCommunityMessage)
      .filter((post): post is NonNullable<typeof post> => Boolean(post) && post.role === auth.profile.role)
      .filter((post) => {
        const scheduledAt = post.scheduledAt ? new Date(post.scheduledAt).getTime() : null;
        const isFutureScheduled = scheduledAt ? scheduledAt > now : false;
        const isOwnProfile = Boolean(authorId) && authorId === auth.profile.id;

        if (isFutureScheduled && !isOwnProfile) return false;
        if (!authorId && post.visibility === "profile") return false;
        return true;
      })
      .filter((post) => !authorId || post?.authorId === authorId),
  });
}

async function handleCreateCommunityPost(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);
  if (supabase) {
    const siteConfig = await getSiteConfig(supabase);
    if (!siteConfig.system.communityEnabled) {
      return json({ error: "Community is temporarily disabled" }, { status: 403 });
    }
  }

  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  const body = (await readJsonBody(request)) as Partial<CommunityMessagePayload>;
  const payload = normalizeCommunityPayload({
    ...body,
    role: auth.profile.role,
  });
  const trimmedContent = payload.content;

  if (trimmedContent.length < 2 || trimmedContent.length > 280) {
    return json({ error: "Post must be between 2 and 280 characters" }, { status: 400 });
  }

  const { data, error } = await (
    auth.supabase.from("messages") as unknown as {
      insert: (row: {
        sender_id: string;
        receiver_id: string;
        content: string;
      }) => {
        select: (columns: string) => {
          single: () => Promise<{
            data: Record<string, unknown> | null;
            error: { message?: string } | null;
          }>;
        };
      };
    }
  )
    .insert({
      sender_id: auth.profile.id,
      receiver_id: auth.profile.id,
      content: encodeCommunityMessage(payload),
    })
    .select(
      "id, sender_id, content, created_at, profiles:sender_id(id, full_name, role, avatar_url)",
    )
    .single();

  if (error || !data) {
    return json({ error: error?.message || "Unable to create community post" }, { status: 502 });
  }

  return json({ post: mapCommunityMessage(data) });
}

async function handleGetCommunityProfile(
  request: Request,
  env: WorkerEnv,
  pathname: string,
) {
  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  const profileId = decodeURIComponent(pathname.replace("/api/community/profile/", ""));
  const { data, error } = await (
    auth.supabase.from("profiles") as unknown as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            single: () => Promise<{
              data: {
                id: string;
                full_name: string | null;
                role: string;
                avatar_url: string | null;
              } | null;
              error: { message?: string } | null;
            }>;
          };
        };
      };
    }
  )
    .select("id, full_name, role, avatar_url")
    .eq("id", profileId)
    .eq("role", auth.profile.role)
    .single();

  if (error || !data) {
    return json({ error: "Community profile not found" }, { status: 404 });
  }

  return json({
    viewer: auth.profile,
    profile: {
      id: data.id,
      fullName: data.full_name || "Tripetrip Member",
      role: data.role,
      avatarUrl: data.avatar_url || null,
    },
  });
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function sha1(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(value),
  );
  return toHex(digest);
}

async function handleCloudinarySign(env: WorkerEnv) {
  const cloudName =
    env.CLOUDINARY_CLOUD_NAME || env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const folder = env.CLOUDINARY_UPLOAD_FOLDER || "tripetrip";

  if (!cloudName || !apiKey || !apiSecret) {
    return json(
      { error: "Cloudinary upload is not configured" },
      { status: 503 },
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = await sha1(
    `folder=${folder}&timestamp=${timestamp}${apiSecret}`,
  );

  return json({
    signature,
    timestamp,
    apiKey,
    cloudName,
    folder,
  });
}

async function handleMapSuggestions(request: Request, env: WorkerEnv) {
  const baseUrl = env.NOMINATIM_BASE_URL || env.VITE_NOMINATIM_BASE_URL;
  if (!baseUrl) {
    return json({ error: "Maps are not configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return json({ suggestions: [] });
  }

  const endpoint =
    `${baseUrl.replace(/\/+$/, "")}/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    return json({ error: "Unable to load map suggestions" }, { status: 502 });
  }

  const payload = (await response.json()) as Array<{
    place_id?: number | string;
    display_name?: string;
    type?: string;
  }>;

  return json({
    suggestions: (payload || [])
      .filter((feature) => feature.place_id && feature.display_name)
      .map((feature) => ({
        id: String(feature.place_id),
        label: String(feature.display_name),
        secondary: feature.type || undefined,
      })),
  });
}

async function handleEmailSend(request: Request, env: WorkerEnv) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return json({ error: "Email is not configured" }, { status: 503 });
  }

  const { to, subject, html } = (await readJsonBody(request)) as {
    to?: string;
    subject?: string;
    html?: string;
  };

  if (!to || !subject || !html) {
    return json({ error: "Missing to, subject, or html" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      error?: string;
    };

    if (!response.ok) {
      return json(
        { error: payload.message || payload.error || "Email send failed" },
        { status: 502 },
      );
    }

    return json({ id: payload.id ?? null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email send failed";
    return json({ error: message }, { status: 500 });
  }
}

async function handleVendorAIBrief(request: Request, env: WorkerEnv) {
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    return json({ error: "AI provider is not configured" }, { status: 503 });
  }

  const { organizationName, branchName, signals } = (await readJsonBody(
    request,
  )) as {
    organizationName?: string;
    branchName?: string;
    signals?: string[];
  };

  try {
    const prompt = buildVendorAIBriefPrompt({
      organizationName,
      branchName,
      signals: Array.isArray(signals) ? signals : [],
    });
    const providerResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      },
    );

    if (!providerResponse.ok) {
      return json({ error: "AI provider request failed" }, { status: 502 });
    }

    const payload = (await providerResponse.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("\n")
        .trim() || "";

    return json(normalizeVendorAIBrief(text));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI brief generation failed";
    return json({ error: message }, { status: 500 });
  }
}

async function handleRegister(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);

  if (!supabase) {
    return json(
      { error: "Registration service is not configured" },
      { status: 503 },
    );
  }

  const result = await handleRegisterUser(
    (await readJsonBody(request)) as {
      email?: string;
      password?: string;
      fullName?: string;
      role?: string;
    },
    {
      adminAuth: supabase.auth.admin,
      supabase: supabase as unknown as Parameters<
        typeof handleRegisterUser
      >[1]["supabase"],
    },
  );

  return json(result.body, { status: result.status });
}

async function handleLogin(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);

  if (!supabase) {
    return json({ error: "Login service is not configured" }, { status: 503 });
  }

  const result = await handleLoginUser(await readJsonBody(request), {
    auth: supabase.auth,
    supabase: supabase as unknown as Parameters<
      typeof handleLoginUser
    >[1]["supabase"],
  });

  return json(result.body, { status: result.status });
}

async function handleRegisterRequestOtp(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);
  const otpSecret = getOtpSecret(env);

  if (!supabase || !otpSecret) {
    return json({ error: "Registration service is not configured" }, { status: 503 });
  }

  const siteConfig = await getSiteConfig(supabase);
  if (!siteConfig.system.registrationEnabled) {
    return json({ error: "Registration is temporarily disabled" }, { status: 403 });
  }

  try {
    const result = await handleRequestRegistrationOtp(await readJsonBody(request), {
      findUserByEmail: (email) => findUserByEmail((params) => supabase.auth.admin.listUsers(params), email),
      createChallengeToken: (payload) => createEncryptedChallengeToken(payload, otpSecret),
      sendOtpEmail: (input) => sendOtpEmail(env, input),
    });

    return json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send verification code";
    return json({ error: message }, { status: 502 });
  }
}

async function handleRegisterVerifyOtp(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);
  const otpSecret = getOtpSecret(env);

  if (!supabase || !otpSecret) {
    return json({ error: "Registration service is not configured" }, { status: 503 });
  }

  const result = await handleVerifyRegistrationOtp(await readJsonBody(request), {
    verifyChallengeToken: (token) => verifyEncryptedChallengeToken(token, otpSecret),
    adminAuth: supabase.auth.admin,
    supabase: supabase as unknown as Parameters<typeof handleRegisterUser>[1]["supabase"],
  });

  return json(result.body, { status: result.status });
}

async function handlePasswordRequestOtp(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);
  const otpSecret = getOtpSecret(env);

  if (!supabase || !otpSecret) {
    return json({ error: "Password reset service is not configured" }, { status: 503 });
  }

  try {
    const result = await handleRequestPasswordResetOtp(await readJsonBody(request), {
      findUserByEmail: (email) => findUserByEmail((params) => supabase.auth.admin.listUsers(params), email),
      createChallengeToken: (payload) => createEncryptedChallengeToken(payload, otpSecret),
      sendOtpEmail: (input) => sendOtpEmail(env, input),
    });

    return json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send reset code";
    return json({ error: message }, { status: 502 });
  }
}

async function handlePasswordResetWithOtp(request: Request, env: WorkerEnv) {
  const { supabase } = createRepositories(env);
  const otpSecret = getOtpSecret(env);

  if (!supabase || !otpSecret) {
    return json({ error: "Password reset service is not configured" }, { status: 503 });
  }

  const result = await handleResetPasswordWithOtp(await readJsonBody(request), {
    verifyChallengeToken: (token) => verifyEncryptedChallengeToken(token, otpSecret),
    adminAuth: supabase.auth.admin,
  });

  return json(result.body, { status: result.status });
}

async function handleCreateOrder(request: Request, env: WorkerEnv) {
  const { paymentRepository } = createRepositories(env);
  const { amount, bookingId, travelerName, purpose } = (await readJsonBody(
    request,
  )) as {
    amount?: number;
    bookingId?: string;
    travelerName?: string;
    purpose?: string;
  };

  if (!amount || amount <= 0) {
    return json({ error: "A positive amount is required" }, { status: 400 });
  }

  const intent = buildManualPaymentIntent({
    amount,
    bookingId,
    travelerName,
    purpose,
    upiId: env.MANUAL_PAYMENT_UPI_ID || env.TRIPETRIP_UPI_ID,
  });
  const savedIntent = await paymentRepository.create(intent, {
    travelerName,
    purpose,
  });

  return json(savedIntent);
}

async function handleCreateDealBookingRequest(
  request: Request,
  env: WorkerEnv,
) {
  const { supabase, paymentRepository, bookingRepository, inventoryRepository } =
    createRepositories(env);
  if (supabase) {
    const siteConfig = await getSiteConfig(supabase);
    if (!siteConfig.system.dealsEnabled) {
      return json(
        { error: "Deals are temporarily disabled by the Tripetrip admin team." },
        { status: 403 },
      );
    }
  }

  const result = await handleCreateDealBooking(
    (await readJsonBody(request)) as {
      dealId?: string;
      dealTitle?: string;
      amount?: number;
      travelerName?: string;
      travelerEmail?: string;
      travelDate?: string;
      participants?: number;
    },
    { paymentRepository, bookingRepository, inventoryRepository },
    { upiId: env.MANUAL_PAYMENT_UPI_ID || env.TRIPETRIP_UPI_ID },
  );

  return json(result.body, { status: result.status });
}

async function handleGetDealBooking(pathname: string, env: WorkerEnv) {
  const { supabase, bookingRepository } = createRepositories(env);
  if (supabase) {
    const siteConfig = await getSiteConfig(supabase);
    if (!siteConfig.system.dealsEnabled) {
      return json(
        { error: "Deals are temporarily disabled by the Tripetrip admin team." },
        { status: 403 },
      );
    }
  }

  const bookingId = decodeURIComponent(
    pathname.replace("/api/deals/bookings/", ""),
  );
  const booking = await bookingRepository.getByBookingId(bookingId);

  if (!booking) {
    return json({ error: "Deal booking not found" }, { status: 404 });
  }

  return json({ booking });
}

async function handleListManualPayments(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  const { paymentRepository } = createRepositories(env);
  const payments = await paymentRepository.list();

  return json({ payments });
}

async function handlePaymentDecision(request: Request, pathname: string, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  const match = pathname.match(
    /^\/api\/admin\/payments\/([^/]+)\/(approve|reject)$/,
  );
  if (!match) return json({ error: "Not found" }, { status: 404 });

  const [, paymentId, action] = match;
  const decision = action === "approve" ? "approved" : "rejected";
  const { paymentRepository, bookingRepository } = createRepositories(env);
  const updated = await paymentRepository.updateStatus(
    decodeURIComponent(paymentId),
    decision,
  );

  if (!updated) {
    return json({ error: "Manual payment not found" }, { status: 404 });
  }

  const booking = await bookingRepository.updatePaymentDecision(
    decodeURIComponent(paymentId),
    decision,
  );

  return json({ payment: updated, booking });
}

async function handleAdminOverview(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;
  return json(await getAdminOverview(auth.supabase));
}

async function handleAdminUsers(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    return json({ users: await listAdminUsers(auth.supabase) });
  }

  const body = await readJsonBody(request);
  await updateAdminUser(auth.supabase, auth.profile, {
    userId: String(body.userId || ""),
    role: body.role,
    fullName: typeof body.fullName === "string" ? body.fullName : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
    suspend: typeof body.suspend === "boolean" ? body.suspend : undefined,
  });
  return json({ success: true });
}

async function handleAdminVendors(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    return json({ vendors: await listAdminVendors(auth.supabase) });
  }

  const body = await readJsonBody(request);
  await updateAdminVendor(auth.supabase, auth.profile, {
    vendorId: String(body.vendorId || ""),
    verificationStatus: body.verificationStatus,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    businessName: typeof body.businessName === "string" ? body.businessName : undefined,
    businessType: typeof body.businessType === "string" ? body.businessType : undefined,
    slug: typeof body.slug === "string" ? body.slug : undefined,
  });
  return json({ success: true });
}

async function handleAdminListings(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    return json({ listings: await listAdminListings(auth.supabase) });
  }

  const body = await readJsonBody(request);
  await updateAdminListing(auth.supabase, auth.profile, {
    listingId: String(body.listingId || ""),
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    title: typeof body.title === "string" ? body.title : undefined,
    category: typeof body.category === "string" ? body.category : undefined,
    basePrice: typeof body.basePrice === "number" ? body.basePrice : undefined,
  });
  return json({ success: true });
}

async function handleAdminBookings(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    return json({ bookings: await listAdminBookings(auth.supabase) });
  }

  const body = await readJsonBody(request);
  await updateAdminBooking(auth.supabase, auth.profile, {
    bookingId: String(body.bookingId || ""),
    status: typeof body.status === "string" ? body.status : undefined,
    paymentStatus: typeof body.paymentStatus === "string" ? body.paymentStatus : undefined,
  });
  return json({ success: true });
}

async function handleAdminCommunity(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    return json({ posts: await listAdminCommunityPosts(auth.supabase) });
  }

  const body = await readJsonBody(request);
  await removeAdminCommunityPost(auth.supabase, auth.profile, String(body.postId || ""));
  return json({ success: true });
}

async function handleAdminDeals(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;
  await logAdminAction(auth.supabase, auth.profile, {
    module: "deals",
    action: "view",
    entityType: "deal_dashboard",
    entityId: "all",
    summary: "Viewed deal controls",
  });
  return json({ deals: listAdminDeals() });
}

async function handleAdminContent(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    const siteConfig = await getSiteConfig(auth.supabase);
    return json({ config: siteConfig.content, preview: getAdminContentPreview(siteConfig.content) });
  }

  const body = await readJsonBody(request);
  await saveSiteConfig(auth.supabase, auth.profile, "content", body);
  await logAdminAction(auth.supabase, auth.profile, {
    module: "content",
    action: "update",
    entityType: "site_content_config",
    entityId: "content",
    summary: "Updated public content controls",
    details: body,
  });
  return json({ success: true });
}

async function handleAdminSystem(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    return json(await getAdminSystemState(auth.supabase, getConfigHealth(env)));
  }

  const body = await readJsonBody(request);
  await saveSiteConfig(auth.supabase, auth.profile, "system", body);
  await logAdminAction(auth.supabase, auth.profile, {
    module: "system",
    action: "update",
    entityType: "site_system_config",
    entityId: "system",
    summary: "Updated platform system controls",
    details: body,
  });
  return json({ success: true });
}

async function handleAdminAudit(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;
  return json({ entries: await listAdminAuditEntries(auth.supabase) });
}

async function handleAdminAccommodationAccess(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedAdmin(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    return json({ vendors: await listAdminAccommodationAccess(auth.supabase) });
  }

  const body = await readJsonBody(request);
  const access = await saveAdminAccommodationAccess(auth.supabase, auth.profile, {
    vendorProfileId: String(body.vendorProfileId || ""),
    businessType: String(body.businessType || ""),
    providerFamily: body.providerFamily,
    planTier: body.planTier,
    enforcementMode: body.enforcementMode,
    moduleOverrides: typeof body.moduleOverrides === "object" && body.moduleOverrides ? body.moduleOverrides : {},
    capabilityOverrides: typeof body.capabilityOverrides === "object" && body.capabilityOverrides ? body.capabilityOverrides : {},
    approvalOverrides: typeof body.approvalOverrides === "object" && body.approvalOverrides ? body.approvalOverrides : {},
  });

  return json({ success: true, access });
}

async function handleVendorOSAccess(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  const access = await getVendorAccommodationAccess(auth.supabase, {
    organizationId,
    userId: auth.profile.id,
  });

  if (!access) {
    return json({ access: null });
  }

  return json({ access });
}

async function handleVendorOSMutationAuthorization(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  const body = await readJsonBody(request);
  const module = String(body.module || "").trim();
  const action = String(body.action || "").trim();
  const organizationId = String(body.organizationId || "").trim();

  if (!module || !organizationId || !["create", "update", "delete", "upload"].includes(action)) {
    return json({ error: "Invalid vendor-os mutation authorization request" }, { status: 400 });
  }

  const operation = getVendorOSOperation(module as Parameters<typeof getVendorOSOperation>[0]);
  if (!operation) {
    return json({ error: "Unsupported vendor-os module" }, { status: 400 });
  }

  const access = await getVendorAccommodationAccess(auth.supabase, {
    organizationId,
    userId: auth.profile.id,
  });

  if (!access || access.moduleVisibility[operation.module]) {
    return json({ allowed: true });
  }

  return json({ error: "This module is not enabled for this vendor account." }, { status: 403 });
}

async function handleVendorOSRecords(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  const body = await readJsonBody(request);
  const module = String(body.module || "").trim();
  const organizationId = String(body.organizationId || "").trim();
  const recordId = String(body.recordId || "").trim();
  const input = body.input && typeof body.input === "object" ? body.input : {};
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const operation = module ? getVendorOSOperation(module as Parameters<typeof getVendorOSOperation>[0]) : null;

  if (!operation || !organizationId) {
    return json({ error: "Invalid vendor-os record request" }, { status: 400 });
  }

  const access = await getVendorAccommodationAccess(auth.supabase, {
    organizationId,
    userId: auth.profile.id,
  });

  if (access && !access.moduleVisibility[operation.module]) {
    return json({ error: "This module is not enabled for this vendor account." }, { status: 403 });
  }

  if (request.method === "POST") {
    const insertPayload = {
      organization_id: organizationId,
      ...(operation.branchScoped === false ? {} : { branch_id: body.branchId || null }),
      ...(payload as Record<string, unknown>),
    };
    const vendorTable = auth.supabase.from(operation.table) as unknown as {
      insert: (row: Record<string, unknown>) => {
        select: () => {
          single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
        };
      };
    };
    const auditTable = auth.supabase.from("vendor_audit_logs") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
    };
    const { data, error } = await vendorTable
      .insert(insertPayload)
      .select()
      .single();

    if (error || !data) {
      return json({ error: error?.message || "Unable to create vendor-os record" }, { status: 500 });
    }

    await auditTable.insert({
      organization_id: data.organization_id,
      branch_id: data.branch_id || null,
      actor_user_id: auth.profile.id,
      module: operation.module,
      action: `${operation.module}.created`,
      entity_type: operation.table,
      entity_id: data.id,
      severity: "info",
      metadata: {
        fields: Object.keys(payload as Record<string, unknown>),
        table: operation.table,
        title_field: operation.titleField,
      },
    });

    return json({ record: data });
  }

  if (!recordId) {
    return json({ error: "Record id is required" }, { status: 400 });
  }

  if (request.method === "PATCH") {
    const vendorTable = auth.supabase.from(operation.table) as unknown as {
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            select: () => {
              single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
            };
          };
        };
      };
    };
    const auditTable = auth.supabase.from("vendor_audit_logs") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
    };
    const { data, error } = await vendorTable
      .update(input)
      .eq("id", recordId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error || !data) {
      return json({ error: error?.message || "Unable to update vendor-os record" }, { status: 500 });
    }

    await auditTable.insert({
      organization_id: data.organization_id,
      branch_id: data.branch_id || null,
      actor_user_id: auth.profile.id,
      module: operation.module,
      action: `${operation.module}.updated`,
      entity_type: operation.table,
      entity_id: data.id,
      severity: "info",
      metadata: {
        changed_fields: Object.keys(input as Record<string, unknown>),
        table: operation.table,
        title_field: operation.titleField,
      },
    });

    return json({ record: data });
  }

  if (request.method === "DELETE") {
    const vendorTable = auth.supabase.from(operation.table) as unknown as {
      delete: () => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            select: () => {
              single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
            };
          };
        };
      };
    };
    const auditTable = auth.supabase.from("vendor_audit_logs") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
    };
    const { data, error } = await vendorTable
      .delete()
      .eq("id", recordId)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (error || !data) {
      return json({ error: error?.message || "Unable to delete vendor-os record" }, { status: 500 });
    }

    await auditTable.insert({
      organization_id: data.organization_id,
      branch_id: data.branch_id || null,
      actor_user_id: auth.profile.id,
      module: operation.module,
      action: `${operation.module}.deleted`,
      entity_type: operation.table,
      entity_id: data.id,
      severity: "info",
      metadata: {
        table: operation.table,
        title_field: operation.titleField,
      },
    });

    return json({ id: recordId });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleVendorPmsRecords(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    const url = new URL(request.url);
    const resourceKey = String(url.searchParams.get("resource") || "").trim() as VendorPmsResource;
    const organizationId = String(url.searchParams.get("organizationId") || "").trim();
    const resource = vendorPmsResources[resourceKey];

    if (!resource || !organizationId) {
      return json({ error: "Invalid vendor PMS read request" }, { status: 400 });
    }

    const access = await getVendorAccommodationAccess(auth.supabase, {
      organizationId,
      userId: auth.profile.id,
    });

    if (access && !access.moduleVisibility.pms) {
      return json({ error: "This module is not enabled for this vendor account." }, { status: 403 });
    }

    const query = (auth.supabase.from(resource.table) as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (count: number) => Promise<{ data: Array<Record<string, unknown>> | null; error?: { message?: string } | null }>;
          };
        };
      };
    })
      .select("*")
      .eq("organization_id", organizationId)
      .order(resource.orderBy, { ascending: false });

    const { data, error } = await query.limit(100);
    if (error) {
      return json({ error: error.message || "Unable to load PMS records" }, { status: 500 });
    }

    return json({ records: data || [] });
  }

  const body = await readJsonBody(request);
  const resourceKey = String(body.resource || "").trim() as VendorPmsResource;
  const organizationId = String(body.organizationId || "").trim();
  const recordId = String(body.recordId || "").trim();
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const input = body.input && typeof body.input === "object" ? body.input : {};
  const resource = vendorPmsResources[resourceKey];

  if (!resource || !organizationId) {
    return json({ error: "Invalid vendor PMS record request" }, { status: 400 });
  }

  const access = await getVendorAccommodationAccess(auth.supabase, {
    organizationId,
    userId: auth.profile.id,
  });

  if (access && !access.moduleVisibility.pms) {
    return json({ error: "This module is not enabled for this vendor account." }, { status: 403 });
  }

  if (request.method === "POST") {
    const insertPayload = {
      organization_id: organizationId,
      ...(resource.branchScoped ? { branch_id: body.branchId || null } : {}),
      ...(payload as Record<string, unknown>),
    };
    const vendorTable = auth.supabase.from(resource.table) as unknown as {
      insert: (row: Record<string, unknown>) => {
        select: () => {
          single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
        };
      };
    };
    const auditTable = auth.supabase.from("vendor_audit_logs") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
    };
    const { data, error } = await vendorTable.insert(insertPayload).select().single();

    if (error || !data) {
      return json({ error: error?.message || "Unable to create PMS record" }, { status: 500 });
    }

    await auditTable.insert({
      organization_id: data.organization_id,
      branch_id: data.branch_id || null,
      actor_user_id: auth.profile.id,
      module: "pms",
      action: `pms.${resourceKey}.created`,
      entity_type: resource.table,
      entity_id: data.id,
      severity: "info",
      metadata: {
        fields: Object.keys(payload as Record<string, unknown>),
        table: resource.table,
      },
    });

    return json({ record: data });
  }

  if (request.method === "PATCH") {
    if (!recordId) {
      return json({ error: "Record id is required" }, { status: 400 });
    }
    const vendorTable = auth.supabase.from(resource.table) as unknown as {
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            select: () => {
              single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
            };
          };
        };
      };
    };
    const auditTable = auth.supabase.from("vendor_audit_logs") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
    };
    const { data, error } = await vendorTable.update(input).eq("id", recordId).eq("organization_id", organizationId).select().single();
    if (error || !data) {
      return json({ error: error?.message || "Unable to update PMS record" }, { status: 500 });
    }

    await auditTable.insert({
      organization_id: data.organization_id,
      branch_id: data.branch_id || null,
      actor_user_id: auth.profile.id,
      module: "pms",
      action: `pms.${resourceKey}.updated`,
      entity_type: resource.table,
      entity_id: data.id,
      severity: "info",
      metadata: {
        changed_fields: Object.keys(input as Record<string, unknown>),
        table: resource.table,
      },
    });

    return json({ record: data });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handleVendorAccountingRecords(request: Request, env: WorkerEnv) {
  const auth = await getAuthenticatedProfile(request, env);
  if ("error" in auth) return auth.error;

  if (request.method === "GET") {
    const url = new URL(request.url);
    const resourceKey = String(url.searchParams.get("resource") || "").trim() as VendorAccountingResource;
    const organizationId = String(url.searchParams.get("organizationId") || "").trim();
    const resource = vendorAccountingResources[resourceKey];

    if (!resource || !organizationId) {
      return json({ error: "Invalid vendor accounting read request" }, { status: 400 });
    }

    const query = (auth.supabase.from(resource.table) as {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (count: number) => Promise<{ data: Array<Record<string, unknown>> | null; error?: { message?: string } | null }>;
          };
        };
      };
    })
      .select("*")
      .eq("organization_id", organizationId)
      .order(resource.orderBy, { ascending: false });

    const { data, error } = await query.limit(100);
    if (error) {
      return json({ error: error.message || "Unable to load accounting records" }, { status: 500 });
    }

    return json({ records: data || [] });
  }

  const body = await readJsonBody(request);
  const resourceKey = String(body.resource || "").trim() as VendorAccountingResource;
  const organizationId = String(body.organizationId || "").trim();
  const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
  const resource = vendorAccountingResources[resourceKey];

  if (!resource || !organizationId) {
    return json({ error: "Invalid vendor accounting record request" }, { status: 400 });
  }

  if (request.method === "POST") {
    const insertPayload = {
      organization_id: organizationId,
      ...(resource.branchScoped ? { branch_id: body.branchId || null } : {}),
      ...(payload as Record<string, unknown>),
    };
    const vendorTable = auth.supabase.from(resource.table) as unknown as {
      insert: (row: Record<string, unknown>) => {
        select: () => {
          single: () => Promise<{ data: Record<string, unknown> | null; error: { message?: string } | null }>;
        };
      };
    };
    const auditTable = auth.supabase.from("vendor_audit_logs") as unknown as {
      insert: (row: Record<string, unknown>) => Promise<{ data?: unknown; error?: { message?: string } | null }>;
    };
    const { data, error } = await vendorTable.insert(insertPayload).select().single();
    if (error || !data) {
      return json({ error: error?.message || "Unable to create accounting record" }, { status: 500 });
    }

    await auditTable.insert({
      organization_id: data.organization_id,
      branch_id: data.branch_id || null,
      actor_user_id: auth.profile.id,
      module: "accounting",
      action: `accounting.${resourceKey}.created`,
      entity_type: resource.table,
      entity_id: data.id,
      severity: "info",
      metadata: {
        fields: Object.keys(payload as Record<string, unknown>),
        table: resource.table,
      },
    });

    return json({ record: data });
  }

  return json({ error: "Method not allowed" }, { status: 405 });
}

async function handlePublicSiteConfig(env: WorkerEnv) {
  const { supabase } = createRepositories(env);
  if (!supabase) {
    return json({
      content: DEFAULT_CONTENT_CONFIG,
      system: DEFAULT_SYSTEM_CONFIG,
      preview: getAdminContentPreview(DEFAULT_CONTENT_CONFIG),
    });
  }

  const siteConfig = await getSiteConfig(supabase);
  return json({
    content: siteConfig.content,
    system: siteConfig.system,
    preview: getAdminContentPreview(siteConfig.content),
  });
}

async function handleApiRequest(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === "GET" && pathname === "/api/health")
    return json({ status: "ok" });
  if (request.method === "GET" && pathname === "/api/config/health")
    return json(getConfigHealth(env));
  if (request.method === "GET" && pathname === "/api/public/site-config")
    return handlePublicSiteConfig(env);
  if (request.method === "GET" && pathname === "/api/cloudinary/sign")
    return handleCloudinarySign(env);
  if (request.method === "GET" && pathname === "/api/maps/suggest")
    return handleMapSuggestions(request, env);
  if (request.method === "POST" && pathname === "/api/email/send")
    return handleEmailSend(request, env);
  if (request.method === "POST" && pathname === "/api/vendor-os/ai/brief")
    return handleVendorAIBrief(request, env);
  if (request.method === "POST" && pathname === "/api/vendor-os/mutations/authorize")
    return handleVendorOSMutationAuthorization(request, env);
  if ((request.method === "GET" || request.method === "POST") && pathname === "/api/vendor-os/accounting")
    return handleVendorAccountingRecords(request, env);
  if ((request.method === "GET" || request.method === "POST" || request.method === "PATCH") && pathname === "/api/vendor-os/pms")
    return handleVendorPmsRecords(request, env);
  if ((request.method === "POST" || request.method === "PATCH" || request.method === "DELETE") && pathname === "/api/vendor-os/records")
    return handleVendorOSRecords(request, env);
  if (request.method === "POST" && pathname === "/api/auth/login")
    return handleLogin(request, env);
  if (request.method === "POST" && pathname === "/api/auth/register/request-otp")
    return handleRegisterRequestOtp(request, env);
  if (request.method === "POST" && pathname === "/api/auth/register/verify-otp")
    return handleRegisterVerifyOtp(request, env);
  if (request.method === "POST" && pathname === "/api/auth/register")
    return handleRegister(request, env);
  if (request.method === "POST" && pathname === "/api/auth/password/request-otp")
    return handlePasswordRequestOtp(request, env);
  if (request.method === "POST" && pathname === "/api/auth/password/reset-with-otp")
    return handlePasswordResetWithOtp(request, env);
  if (request.method === "GET" && pathname === "/api/vendor-os/access")
    return handleVendorOSAccess(request, env);
  if (request.method === "GET" && pathname === "/api/community/posts")
    return handleListCommunityPosts(request, env);
  if (request.method === "POST" && pathname === "/api/community/posts")
    return handleCreateCommunityPost(request, env);
  if (request.method === "GET" && pathname.startsWith("/api/community/profile/"))
    return handleGetCommunityProfile(request, env, pathname);
  if (request.method === "POST" && pathname === "/api/payments/create-order")
    return handleCreateOrder(request, env);
  if (request.method === "POST" && pathname === "/api/deals/bookings")
    return handleCreateDealBookingRequest(request, env);
  if (request.method === "GET" && pathname.startsWith("/api/deals/bookings/"))
    return handleGetDealBooking(pathname, env);
  if (request.method === "GET" && pathname === "/api/admin/payments/manual")
    return handleListManualPayments(request, env);
  if (request.method === "GET" && pathname === "/api/admin/overview")
    return handleAdminOverview(request, env);
  if ((request.method === "GET" || request.method === "PATCH") && pathname === "/api/admin/users")
    return handleAdminUsers(request, env);
  if ((request.method === "GET" || request.method === "PATCH") && pathname === "/api/admin/vendors")
    return handleAdminVendors(request, env);
  if ((request.method === "GET" || request.method === "PATCH") && pathname === "/api/admin/listings")
    return handleAdminListings(request, env);
  if ((request.method === "GET" || request.method === "PATCH") && pathname === "/api/admin/bookings")
    return handleAdminBookings(request, env);
  if ((request.method === "GET" || request.method === "DELETE") && pathname === "/api/admin/community/posts")
    return handleAdminCommunity(request, env);
  if (request.method === "GET" && pathname === "/api/admin/deals")
    return handleAdminDeals(request, env);
  if ((request.method === "GET" || request.method === "PUT") && pathname === "/api/admin/content")
    return handleAdminContent(request, env);
  if ((request.method === "GET" || request.method === "PUT") && pathname === "/api/admin/system")
    return handleAdminSystem(request, env);
  if (request.method === "GET" && pathname === "/api/admin/audit")
    return handleAdminAudit(request, env);
  if ((request.method === "GET" || request.method === "PATCH") && pathname === "/api/admin/accommodation/access")
    return handleAdminAccommodationAccess(request, env);
  if (
    request.method === "POST" &&
    /^\/api\/admin\/payments\/[^/]+\/(approve|reject)$/.test(pathname)
  ) {
    return handlePaymentDecision(request, pathname, env);
  }

  return json({ error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    return injectRuntimeConfig(await env.ASSETS.fetch(request), env);
  },
};
