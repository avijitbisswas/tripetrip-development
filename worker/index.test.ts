import { describe, expect, it, vi } from "vitest";
import worker, { type WorkerEnv } from "./index";

function createEnv(overrides: Partial<WorkerEnv> = {}): WorkerEnv {
  return {
    ASSETS: {
      fetch: vi.fn(async () => new Response("asset response", { status: 200 })),
    },
    ...overrides,
  };
}

describe("cloudflare worker runtime", () => {
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
});
