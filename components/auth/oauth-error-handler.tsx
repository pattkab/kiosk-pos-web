"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function getOAuthParams() {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash,
  );

  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });

  return params;
}

function getOAuthErrorMessage(params: URLSearchParams) {
  const error = params.get("error");
  const code = params.get("error_code");
  const description = params.get("error_description");
  const oauthErrorNames = new Set([
    "access_denied",
    "invalid_request",
    "server_error",
    "temporarily_unavailable",
  ]);

  if (!error && !description) return null;
  if (!description && !code && (!error || !oauthErrorNames.has(error))) {
    return null;
  }

  if (
    code === "flow_state_already_used" ||
    description?.toLowerCase().includes("state has already been used")
  ) {
    return "That Google sign-in attempt has already been used. Please start a fresh Google sign-in from Kiosk POS.";
  }

  return description ?? error ?? "Sign-in failed.";
}

export function OAuthErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const message = getOAuthErrorMessage(getOAuthParams());
    if (!message) return;

    router.replace(
      `/auth/auth-code-error?message=${encodeURIComponent(message)}`,
    );
  }, [router]);

  return null;
}
