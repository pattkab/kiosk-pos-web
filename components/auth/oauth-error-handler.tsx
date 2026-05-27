"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OAuthErrorHandler() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const search = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search;
    const params = new URLSearchParams(hash || search);

    const error = params.get("error");
    const description = params.get("error_description");
    if (!error && !description) return;

    const message = description ?? error ?? "Sign-in failed.";
    router.replace(`/auth/auth-code-error?message=${encodeURIComponent(message)}`);
  }, [router]);

  return null;
}
