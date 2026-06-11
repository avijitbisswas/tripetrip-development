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
    };
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
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
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
  if (request.method === "GET" && pathname === "/api/cloudinary/sign")
    return handleCloudinarySign(env);
  if (request.method === "POST" && pathname === "/api/email/send")
    return handleEmailSend(request, env);
  if (request.method === "POST" && pathname === "/api/vendor-os/ai/brief")
    return handleVendorAIBrief(request, env);
  if (request.method === "POST" && pathname === "/api/auth/register")
    return handleRegister(request, env);
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
