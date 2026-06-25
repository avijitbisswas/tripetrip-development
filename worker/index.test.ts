import { beforeEach, describe, expect, it, vi } from "vitest";
import worker, { type WorkerEnv } from "./index";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

function createEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    ASSETS: {
      fetch: vi.fn(async () => new Response("asset response", { status: 200 })),
    },
    ...overrides,
  };
}

function createSelectQuery(result: unknown) {
  const query: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    like: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    single: vi.fn(async () => result),
  };

  query.then = vi.fn((resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result)));
  return query;
}

function createCommunitySupabaseMock() {
  const auth = {
    getUser: vi.fn(async () => ({
      data: { user: { id: "user-1" } },
      error: null,
    })),
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
  };
  const insertSingle = vi.fn(async () => ({
    data: {
      id: "post-2",
      sender_id: "user-1",
      content: '__tripetrip_community__:{"role":"traveler","content":"Fresh road note"}',
      created_at: "2026-06-18T09:00:00.000Z",
      profiles: { id: "user-1", full_name: "Traveler One", role: "traveler", avatar_url: null },
    },
    error: null,
  }));
  const insertSelect = vi.fn(() => ({ single: insertSingle }));
  const insert = vi.fn(() => ({ select: insertSelect }));
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: { id: "user-1", full_name: "Traveler One", role: "traveler", avatar_url: null },
              error: null,
            })),
          })),
        })),
      };
    }

    if (table === "messages") {
      return {
        select: vi.fn(() =>
          createSelectQuery({
            data: [
              {
                id: "post-1",
                sender_id: "user-1",
                content: '__tripetrip_community__:{"role":"traveler","content":"Looking for monsoon trek tips."}',
                created_at: "2026-06-18T08:00:00.000Z",
                profiles: { id: "user-1", full_name: "Traveler One", role: "traveler", avatar_url: null },
              },
            ],
            error: null,
          }),
        ),
        insert,
      };
    }

    return {};
  });

  return { auth, from, insert };
}

describe("cloudflare worker runtime", () => {
  beforeEach(() => {
    createClientMock.mockReset();
  });

  it("returns API health without serving static assets", async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/health"),
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("delegates frontend routes to static assets", async () => {
    const env = createEnv();
    const request = new Request("https://tripetrip.example/deals/confirmation");

    const response = await worker.fetch(request, env);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("asset response");
    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
  });

  it("injects public Supabase runtime config into frontend HTML", async () => {
    const html = '<!doctype html><html><head></head><body><div id="root"></div></body></html>';
    const env = createEnv({
      ASSETS: {
        fetch: vi.fn(async () => new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })),
      },
      SUPABASE_PROJECT_REF: "runtime-ref",
      VITE_SUPABASE_ANON_KEY: "runtime-anon-key",
    });

    const response = await worker.fetch(new Request("https://tripetrip.example/"), env);
    const body = await response.text();

    expect(body).toContain("window.__TRIPETRIP_CONFIG__");
    expect(body).toContain("https://runtime-ref.supabase.co");
    expect(body).toContain("runtime-anon-key");
  });

  it("reports configuration health without exposing secret values", async () => {
    const env = createEnv({
      SUPABASE_PROJECT_REF: "tripetrip-ref",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
      CLOUDINARY_CLOUD_NAME: "tripetrip-cloud",
      CLOUDINARY_API_KEY: "cloudinary-key",
      CLOUDINARY_API_SECRET: "cloudinary-secret",
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "Tripetrip <hello@tripetrip.com>",
      GEMINI_API_KEY: "gemini-key",
      MANUAL_PAYMENT_UPI_ID: "tripetrip@upi",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/config/health"),
      env,
    );
    const bodyText = await response.text();

    expect(response.status).toBe(200);
    expect(JSON.parse(bodyText)).toEqual({
      status: "ok",
      version: "2026-06-15",
      supabase: { configured: true, url: true, serviceKey: true },
      cloudinary: {
        configured: true,
        cloudName: true,
        apiKey: true,
        apiSecret: true,
      },
      email: {
        configured: true,
        resendApiKey: true,
        resendFromEmail: true,
      },
      ai: { configured: true, geminiApiKey: true },
      payments: { configured: true, manualPaymentUpi: true },
    });
    expect(bodyText).not.toContain("service-role-secret");
    expect(bodyText).not.toContain("cloudinary-secret");
    expect(bodyText).not.toContain("resend-key");
    expect(bodyText).not.toContain("gemini-key");
  });

  it("returns default public site config when Supabase is unavailable", async () => {
    const env = createEnv();

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/public/site-config"),
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      content: {
        homepageAnnouncement: "",
        featuredDealSlugs: ["goa-beach-escape", "manali-snow-retreat"],
      },
      system: {
        registrationEnabled: true,
        communityEnabled: true,
        dealsEnabled: true,
        maintenanceMode: false,
      },
    });
  });

  it("logs in users through the server Supabase client", async () => {
    const signInWithPassword = vi.fn(async () => ({
      data: {
        user: {
          id: "vendor-1",
          email: "demo.vendor@tripetrip.test",
        },
      },
      error: null,
    }));
    const single = vi.fn(async () => ({
      data: { role: "vendor", full_name: "Demo Vendor" },
      error: null,
    }));
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    createClientMock.mockReturnValue({
      auth: {
        signInWithPassword,
        admin: {
          createUser: vi.fn(),
          deleteUser: vi.fn(),
        },
      },
      from,
    });
    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "DEMO.VENDOR@TRIPETRIP.TEST",
          password: "Tripetrip@123",
        }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "demo.vendor@tripetrip.test",
      password: "Tripetrip@123",
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("role, full_name");
    expect(eq).toHaveBeenCalledWith("id", "vendor-1");
    await expect(response.json()).resolves.toEqual({
      user: {
        id: "vendor-1",
        email: "demo.vendor@tripetrip.test",
        role: "vendor",
        fullName: "Demo Vendor",
      },
    });
  });

  it("completes the registration OTP flow before creating the account", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.123456);
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "email_otp_1" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const createUser = vi.fn(async () => ({ data: { user: { id: "user-otp-1" } }, error: null }));
    const deleteUser = vi.fn();
    const updateUserById = vi.fn();
    const listUsers = vi.fn(async () => ({
      data: { users: [], aud: "authenticated", nextPage: null, lastPage: 0, total: 0 },
      error: null,
    }));
    const profileSingle = vi.fn(async () => ({ data: {}, error: null }));
    const vendorSingle = vi.fn(async () => ({ data: {}, error: null }));
    const profileSelect = vi.fn(() => ({ single: profileSingle }));
    const vendorSelect = vi.fn(() => ({ single: vendorSingle }));
    const profileUpsert = vi.fn(() => ({ select: profileSelect }));
    const vendorUpsert = vi.fn(() => ({ select: vendorSelect }));
    const from = vi.fn((table: string) => {
      if (table === "profiles") return { upsert: profileUpsert };
      if (table === "vendor_profiles") return { upsert: vendorUpsert };
      if (table === "messages") {
        return {
          select: vi.fn(() =>
            createSelectQuery({
              data: [],
              error: null,
            }),
          ),
        };
      }
      return {};
    });

    createClientMock.mockReturnValue({
      auth: {
        admin: {
          listUsers,
          createUser,
          deleteUser,
          updateUserById,
        },
      },
      from,
    });

    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "Tripetrip <hello@tripetrip.com>",
    });

    const otpRequest = await worker.fetch(
      new Request("https://tripetrip.example/api/auth/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "new.vendor@example.com",
          fullName: "New Vendor",
          mobile: "9876543210",
          role: "vendor",
        }),
      }),
      env,
    );

    expect(otpRequest.status).toBe(200);
    const otpPayload = await otpRequest.json() as {
      challengeToken: string;
      maskedEmail: string;
    };
    expect(otpPayload.maskedEmail).toBe("n***r@example.com");
    const verifyResponse = await worker.fetch(
      new Request("https://tripetrip.example/api/auth/register/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken: otpPayload.challengeToken,
          otp: "211110",
          password: "Tripetrip@123",
        }),
      }),
      env,
    );

    const verifyBody = await verifyResponse.json();
    expect(verifyResponse.status).toBe(200);
    expect(createUser).toHaveBeenCalledWith({
      email: "new.vendor@example.com",
      password: "Tripetrip@123",
      email_confirm: true,
      user_metadata: {
        full_name: "New Vendor",
        role: "vendor",
        phone: "+919876543210",
      },
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(from).toHaveBeenCalledWith("vendor_profiles");
    expect(verifyBody).toMatchObject({
      user: {
        id: "user-otp-1",
        role: "vendor",
      },
    });
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps Supabase admin listUsers bound when requesting registration OTPs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T12:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.123456);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ id: "email_otp_bound" }), { status: 200 })));

    const admin = {
      fetch: vi.fn(),
      listUsers: vi.fn(function (this: { fetch: (params?: { page?: number; perPage?: number }) => void }, params?: { page?: number; perPage?: number }) {
        this.fetch(params);
        return Promise.resolve({
          data: { users: [], nextPage: null, lastPage: 0 },
          error: null,
        });
      }),
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(),
    };

    createClientMock.mockReturnValue({
      auth: { admin },
      from: vi.fn((table: string) => {
        if (table === "messages") {
          return {
            select: vi.fn(() =>
              createSelectQuery({
                data: [],
                error: null,
              }),
            ),
          };
        }

        return {};
      }),
    });

    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "Tripetrip <hello@tripetrip.com>",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/auth/register/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "bound.user@example.com",
          fullName: "Bound User",
          mobile: "9876543210",
          role: "traveler",
        }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(admin.listUsers).toHaveBeenCalled();
    expect(admin.fetch).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("signs Cloudinary uploads with Worker Web Crypto", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T00:00:00.000Z"));
    const env = createEnv({
      CLOUDINARY_CLOUD_NAME: "tripetrip-cloud",
      CLOUDINARY_API_KEY: "cloudinary-key",
      CLOUDINARY_API_SECRET: "cloudinary-secret",
      CLOUDINARY_UPLOAD_FOLDER: "tripetrip",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/cloudinary/sign"),
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      signature: "06a7d3ba7d5cfb3249065094b1ae2e81f8259ad7",
      timestamp: 1781136000,
      apiKey: "cloudinary-key",
      cloudName: "tripetrip-cloud",
      folder: "tripetrip",
    });
    vi.useRealTimers();
  });

  it("sends email through the Resend HTTP API", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "email_123" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const env = createEnv({
      RESEND_API_KEY: "resend-key",
      RESEND_FROM_EMAIL: "Tripetrip <hello@tripetrip.com>",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/email/send", {
        method: "POST",
        body: JSON.stringify({
          to: "guest@example.com",
          subject: "Welcome",
          html: "<p>Hello</p>",
        }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: "email_123" });
    expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer resend-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tripetrip <hello@tripetrip.com>",
        to: "guest@example.com",
        subject: "Welcome",
        html: "<p>Hello</p>",
      }),
    });
    vi.unstubAllGlobals();
  });

  it("returns map suggestions from Nominatim", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            place_id: 101,
            display_name: "Goa Airport, Goa, India",
            type: "aerodrome",
          },
        ]),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const env = createEnv({
      NOMINATIM_BASE_URL: "https://nominatim.tripetrip.internal",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/maps/suggest?q=Goa"),
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      suggestions: [
        {
          id: "101",
          label: "Goa Airport, Goa, India",
          secondary: "aerodrome",
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://nominatim.tripetrip.internal/search?format=jsonv2&addressdetails=1&limit=5&q=Goa",
    );
    vi.unstubAllGlobals();
  });

  it("rejects community feed requests without a bearer token", async () => {
    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/community/posts"),
      env,
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required" });
  });

  it("lists community posts for the authenticated user's role", async () => {
    const supabase = createCommunitySupabaseMock();
    createClientMock.mockReturnValue(supabase);
    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/community/posts", {
        headers: { Authorization: "Bearer user-token" },
      }),
      env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      viewer: { id: "user-1", role: "traveler" },
      posts: [
        {
          id: "post-1",
          role: "traveler",
          content: "Looking for monsoon trek tips.",
          author: { id: "user-1", fullName: "Traveler One", role: "traveler" },
        },
      ],
    });
  });

  it("creates community posts with the authenticated user's role", async () => {
    const supabase = createCommunitySupabaseMock();
    createClientMock.mockReturnValue(supabase);
    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/community/posts", {
        method: "POST",
        headers: {
          Authorization: "Bearer user-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "Fresh road note" }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(supabase.insert).toHaveBeenCalledWith({
      sender_id: "user-1",
      receiver_id: "user-1",
      content: '__tripetrip_community__:{"role":"traveler","content":"Fresh road note","audience":"everyone","visibility":"feed"}',
    });
    await expect(response.json()).resolves.toMatchObject({
      post: {
        id: "post-2",
        role: "traveler",
        content: "Fresh road note",
      },
    });
  });

  it("stores and returns structured community metadata while keeping profile-only scheduled posts out of the main feed", async () => {
    const insertSingle = vi.fn(async () => ({
      data: {
        id: "post-9",
        sender_id: "user-1",
        content:
          '__tripetrip_community__:{"role":"traveler","content":"Roadtrip update","audience":"circle","visibility":"profile","location":"Munnar, Kerala","scheduledAt":"2099-06-20T10:30:00.000Z","important":true,"media":{"type":"image","url":"https://cdn.example.com/community-photo.jpg"},"poll":{"options":["Tea estates","Waterfalls"]}}',
        created_at: "2026-06-19T08:00:00.000Z",
        profiles: { id: "user-1", full_name: "Traveler One", role: "traveler", avatar_url: null },
      },
      error: null,
    }));
    const insert = vi.fn(() => ({ select: vi.fn(() => ({ single: insertSingle })) }));
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: value, full_name: "Traveler One", role: "traveler", avatar_url: null },
                  error: null,
                })),
              })),
              single: vi.fn(async () => ({
                data: { id: value, full_name: "Traveler One", role: "traveler", avatar_url: null },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === "messages") {
        return {
          select: vi.fn(() =>
            createSelectQuery({
              data: [
                {
                  id: "post-hidden",
                  sender_id: "user-2",
                  content:
                    '__tripetrip_community__:{"role":"traveler","content":"Private itinerary drop","visibility":"profile","scheduledAt":"2099-06-20T10:30:00.000Z"}',
                  created_at: "2026-06-19T09:00:00.000Z",
                  profiles: { id: "user-2", full_name: "Traveler Two", role: "traveler", avatar_url: null },
                },
                {
                  id: "post-live",
                  sender_id: "user-2",
                  content:
                    '__tripetrip_community__:{"role":"traveler","content":"Live now","location":"Goa","important":true}',
                  created_at: "2026-06-19T07:00:00.000Z",
                  profiles: { id: "user-2", full_name: "Traveler Two", role: "traveler", avatar_url: null },
                },
              ],
              error: null,
            }),
          ),
          insert,
        };
      }

      return {};
    });
    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        })),
        admin: {
          createUser: vi.fn(),
          deleteUser: vi.fn(),
        },
      },
      from,
    });
    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });

    const createResponse = await worker.fetch(
      new Request("https://tripetrip.example/api/community/posts", {
        method: "POST",
        headers: {
          Authorization: "Bearer user-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "Roadtrip update",
          audience: "circle",
          visibility: "profile",
          location: "Munnar, Kerala",
          scheduledAt: "2099-06-20T10:30:00.000Z",
          important: true,
          media: {
            type: "image",
            url: "https://cdn.example.com/community-photo.jpg",
          },
          poll: {
            options: ["Tea estates", "Waterfalls"],
          },
        }),
      }),
      env,
    );

    expect(createResponse.status).toBe(200);
    expect(insert).toHaveBeenCalledWith({
      sender_id: "user-1",
      receiver_id: "user-1",
      content:
        '__tripetrip_community__:{"role":"traveler","content":"Roadtrip update","audience":"circle","visibility":"profile","location":"Munnar, Kerala","scheduledAt":"2099-06-20T10:30:00.000Z","important":true,"media":{"type":"image","url":"https://cdn.example.com/community-photo.jpg"},"poll":{"options":["Tea estates","Waterfalls"]}}',
    });
    await expect(createResponse.json()).resolves.toMatchObject({
      post: {
        content: "Roadtrip update",
        audience: "circle",
        visibility: "profile",
        location: "Munnar, Kerala",
        important: true,
        media: {
          type: "image",
          url: "https://cdn.example.com/community-photo.jpg",
        },
        poll: {
          options: ["Tea estates", "Waterfalls"],
        },
      },
    });

    const listResponse = await worker.fetch(
      new Request("https://tripetrip.example/api/community/posts", {
        headers: { Authorization: "Bearer user-token" },
      }),
      env,
    );

    expect(listResponse.status).toBe(200);
    await expect(listResponse.json()).resolves.toMatchObject({
      posts: [
        {
          id: "post-live",
          content: "Live now",
          location: "Goa",
          important: true,
        },
      ],
    });
  });

  it("rejects admin payment requests without admin authentication", async () => {
    const env = createEnv({
      SUPABASE_URL: "https://tripetrip.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });

    createClientMock.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        })),
        admin: {
          listUsers: vi.fn(),
          updateUserById: vi.fn(),
        },
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: "user-1", full_name: "Traveler One", role: "traveler", avatar_url: null },
                  error: null,
                })),
              })),
            })),
          };
        }

        return {};
      }),
    });

    const response = await worker.fetch(
      new Request("https://tripetrip.example/api/admin/payments/manual", {
        headers: { Authorization: "Bearer user-token" },
      }),
      env,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Admin access required" });
  });
});
