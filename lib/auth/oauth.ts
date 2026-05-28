import { getOAuthRedirectOrigin } from "@/lib/app-url";

export function getOAuthCallbackUrl(next = "/select-organization") {
  const appUrl = getOAuthRedirectOrigin();
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  return `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
