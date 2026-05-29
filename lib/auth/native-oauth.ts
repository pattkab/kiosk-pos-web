/** Custom URL scheme for Capacitor Android/iOS (must match AndroidManifest intent filters). */
export const NATIVE_APP_SCHEME = "kioskpos";

export function getNativeOAuthCallbackUrl(next = "/select-organization") {
  const safeNext = next.startsWith("/") ? next : "/select-organization";
  return `${NATIVE_APP_SCHEME}://auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/**
 * Maps kioskpos:// deep links to in-app paths (loaded inside the WebView).
 * e.g. kioskpos://auth/callback?code=… → /auth/callback?code=…
 */
export function resolveNativeDeepLink(url: string): string | null {
  if (!url.startsWith(`${NATIVE_APP_SCHEME}://`)) return null;

  try {
    const parsed = new URL(
      url.replace(new RegExp(`^${NATIVE_APP_SCHEME}://`), "https://kioskpos.internal/")
    );
    let path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (path.startsWith("/open/")) {
      path = path.replace(/^\/open/, "");
    }
    if (!path.startsWith("/")) path = `/${path}`;
    return path;
  } catch {
    return null;
  }
}
