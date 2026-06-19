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
import { handleRegisterUser } from "../src/features/auth/registerRoute";

type AssetsBinding = {
  fetch: (request: Request) => Promise<Response>;
};

export type WorkerEnv = {
  ASSETS: AssetsBinding;
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_PROJECT_REF?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_SERVICE_KEY?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_UPLOAD_FOLDER?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  MANUAL_PAYMENT_UPI_ID?: string;
  TRIPETRIP_UPI_ID?: string;
};

type ServerSupabaseClient = ManualPaymentSupabaseClient &
  DealBookingSupabaseClient &
  DealInventorySupabaseClient & {
    auth: {
      admin: Parameters<typeof handleRegisterUser>[1]["adminAuth"];
      getUser: (token: string) => Promise<{
        data: { user: { id: string } | null } | null;
        error: { message?: string } | null;
      }>;
    };
    from: (table: string) => unknown;
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

async function readJsonBody(request: Request) {
  if (request.method === "GET" || request.method === "HEAD") return {};
  return request.json().catch(() => ({}));
}

function createServerSupabaseClient(env: WorkerEnv) {
  const projectRef = env.SUPABASE_PROJECT_REF?.trim();
  const supabaseUrl =
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    (projectRef ? `https://${projectRef}.supabase.co` : undefined);
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
  const { paymentRepository, bookingRepository, inventoryRepository } =
    createRepositories(env);
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
  const bookingId = decodeURIComponent(
    pathname.replace("/api/deals/bookings/", ""),
  );
  const { bookingRepository } = createRepositories(env);
  const booking = await bookingRepository.getByBookingId(bookingId);

  if (!booking) {
    return json({ error: "Deal booking not found" }, { status: 404 });
  }

  return json({ booking });
}

async function handleListManualPayments(env: WorkerEnv) {
  const { paymentRepository } = createRepositories(env);
  const payments = await paymentRepository.list();

  return json({ payments });
}

async function handlePaymentDecision(pathname: string, env: WorkerEnv) {
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

async function handleApiRequest(request: Request, env: WorkerEnv) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === "GET" && pathname === "/api/health")
    return json({ status: "ok" });
  if (request.method === "GET" && pathname === "/api/config/health")
    return json(getConfigHealth(env));
  if (request.method === "GET" && pathname === "/api/cloudinary/sign")
    return handleCloudinarySign(env);
  if (request.method === "POST" && pathname === "/api/email/send")
    return handleEmailSend(request, env);
  if (request.method === "POST" && pathname === "/api/vendor-os/ai/brief")
    return handleVendorAIBrief(request, env);
  if (request.method === "POST" && pathname === "/api/auth/register")
    return handleRegister(request, env);
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
    return handleListManualPayments(env);
  if (
    request.method === "POST" &&
    /^\/api\/admin\/payments\/[^/]+\/(approve|reject)$/.test(pathname)
  ) {
    return handlePaymentDecision(pathname, env);
  }

  return json({ error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
