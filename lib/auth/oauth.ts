export function getOAuthCallbackUrl(next = "/select-organization") {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  return `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
