import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PRODUCTION_APP_URL,
  getConfiguredAppUrl,
  getOAuthRedirectOrigin,
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

  it("preserves configured production host exactly", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://www.kioskpos.shop");

    expect(getConfiguredAppUrl({ allowLocalhost: false })).toBe(
      "https://www.kioskpos.shop",
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

  it("uses production for OAuth when env is localhost but browser is not", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        origin: "https://kioskpos.shop",
        href: "https://kioskpos.shop/login",
      },
    });

    expect(getOAuthRedirectOrigin()).toBe("https://kioskpos.shop");
    expect(getOAuthCallbackUrl("/reports")).toBe(
      "https://kioskpos.shop/auth/callback?next=%2Freports",
    );
  });

  it("never falls back to localhost for OAuth when allowLocalhost is false", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

    expect(getConfiguredAppUrl({ allowLocalhost: false })).toBe(
      PRODUCTION_APP_URL,
    );
    expect(getOAuthCallbackUrl()).toContain(`${PRODUCTION_APP_URL}/auth/callback`);
  });
});
