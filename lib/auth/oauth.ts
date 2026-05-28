import { getBrowserAppUrl } from "@/lib/app-url";

export function getOAuthCallbackUrl(next = "/select-organization") {
  const appUrl = getBrowserAppUrl();
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  return `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
