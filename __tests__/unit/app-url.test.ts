import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PRODUCTION_APP_URL,
  getConfiguredAppUrl,
  resolveRequestAppUrl,
} from "@/lib/app-url";
import { getOAuthCallbackUrl } from "@/lib/auth/oauth";

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) {
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
  }
  vi.unstubAllEnvs();
});

describe("app URL resolution", () => {
  it("keeps localhost available for local development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    expect(getConfiguredAppUrl({ allowLocalhost: true })).toBe(
      "http://localhost:3000",
    );
  });

  it("does not use localhost as the production fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    expect(getConfiguredAppUrl({ allowLocalhost: false })).toBe(
      PRODUCTION_APP_URL,
    );
  });

  it("normalizes the old www host to the canonical bare domain", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.kioskpos.shop");

    expect(getConfiguredAppUrl({ allowLocalhost: false })).toBe(
      PRODUCTION_APP_URL,
    );
  });

  it("prefers a forwarded production host over an internal request URL", () => {
    const request = new Request("http://localhost:3000/auth/callback", {
      headers: {
        "x-forwarded-host": "kioskpos.shop",
        "x-forwarded-proto": "https",
      },
    });

    expect(resolveRequestAppUrl(request, { allowLocalhost: false })).toBe(
      "https://kioskpos.shop",
    );
  });

  it("uses the live request origin when the configured URL is stale", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    const request = new Request(`${PRODUCTION_APP_URL}/api/billing`);

    expect(resolveRequestAppUrl(request, { allowLocalhost: false })).toBe(
      PRODUCTION_APP_URL,
    );
  });

  it("uses the canonical production URL for OAuth callbacks when localhost is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    expect(getOAuthCallbackUrl("/reports")).toBe(
      `${PRODUCTION_APP_URL}/auth/callback?next=%2Freports`,
    );
  });
});
