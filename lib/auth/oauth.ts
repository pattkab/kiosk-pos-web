import { getBrowserAppUrl, getConfiguredAppUrl } from "@/lib/app-url";

export function getOAuthCallbackUrl(next = "/select-organization") {
  const appUrl =
    process.env.NODE_ENV === "production"
      ? getConfiguredAppUrl({ allowLocalhost: false })
      : getBrowserAppUrl();
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  return `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
