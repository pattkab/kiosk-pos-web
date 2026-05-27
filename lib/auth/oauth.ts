export function getOAuthCallbackUrl(next = "/select-organization") {
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
        "http://localhost:3000");
  const safeNext = next.startsWith("/") ? next : `/${next}`;
  return `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
