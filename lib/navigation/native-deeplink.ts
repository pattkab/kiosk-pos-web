import { getBrowserAppUrl } from "@/lib/app-url";
import { resolveNativeDeepLink } from "@/lib/auth/native-oauth";

/** Navigate the WebView to an in-app path (used after kioskpos:// intents). */
export function navigateNativeDeepLink(rawUrl: string) {
  const path = resolveNativeDeepLink(rawUrl);
  if (!path) return false;

  const origin = getBrowserAppUrl();
  window.location.href = `${origin}${path}`;
  return true;
}
