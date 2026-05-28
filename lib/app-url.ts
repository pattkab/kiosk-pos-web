export const PRODUCTION_APP_URL = "https://kioskpos.shop";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null;
}

export function normalizeAppUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

export function isLocalAppUrl(value: string | null | undefined) {
  const normalized = normalizeAppUrl(value);
  if (!normalized) return false;

  return LOCAL_HOSTS.has(new URL(normalized).hostname);
}

export function getConfiguredAppUrl(options?: { allowLocalhost?: boolean }) {
  const allowLocalhost =
    options?.allowLocalhost ?? process.env.NODE_ENV !== "production";
  const configuredUrl = normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL);

  if (configuredUrl && (allowLocalhost || !isLocalAppUrl(configuredUrl))) {
    return configuredUrl;
  }

  return allowLocalhost ? "http://localhost:3000" : PRODUCTION_APP_URL;
}

export function getBrowserAppUrl() {
  const allowLocalhost = process.env.NODE_ENV !== "production";
  const browserUrl =
    typeof window === "undefined"
      ? null
      : normalizeAppUrl(window.location.origin);

  if (browserUrl && (allowLocalhost || !isLocalAppUrl(browserUrl))) {
    return browserUrl;
  }

  return getConfiguredAppUrl({ allowLocalhost });
}

/** Origin used for OAuth/email redirects — never localhost unless the user is on localhost. */
export function getOAuthRedirectOrigin() {
  if (typeof window !== "undefined") {
    const browserOrigin = normalizeAppUrl(window.location.origin);
    if (browserOrigin && !isLocalAppUrl(browserOrigin)) {
      return browserOrigin;
    }
  }

  return getConfiguredAppUrl({ allowLocalhost: false });
}

export function resolveRequestAppUrl(
  request: Pick<Request, "headers" | "url">,
  options?: { allowLocalhost?: boolean },
) {
  const allowLocalhost =
    options?.allowLocalhost ?? process.env.NODE_ENV !== "production";
  const forwardedHost = firstHeaderValue(
    request.headers.get("x-forwarded-host"),
  );
  const forwardedProto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ?? "https";

  if (forwardedHost) {
    const forwardedUrl = normalizeAppUrl(
      `${forwardedProto}://${forwardedHost}`,
    );
    if (forwardedUrl && (allowLocalhost || !isLocalAppUrl(forwardedUrl))) {
      return forwardedUrl;
    }
  }

  const requestUrl = normalizeAppUrl(request.url);
  if (requestUrl && (allowLocalhost || !isLocalAppUrl(requestUrl))) {
    return requestUrl;
  }

  return getConfiguredAppUrl({ allowLocalhost });
}
