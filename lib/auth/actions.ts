"use client";

import { createClient } from "@/lib/supabase/client";
import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
} from "@/validators/auth";
import { toast } from "sonner";
import { getUserErrorMessage } from "@/lib/errors/user-message";

export async function signIn(data: LoginFormValues) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    const message = getUserErrorMessage(
      error,
      "We could not sign you in. Please try again.",
    );
    toast.error(message);
    return { error: message };
  }

  await supabase.rpc("ensure_profile_for_current_user");

  toast.success("Successfully signed in!");
  return { success: true };
}

export async function signInWithGoogle(next = "/select-organization") {
  const safeNext = next.startsWith("/") ? next : "/select-organization";
  const { isCapacitorNative } = await import("@/lib/utils/capacitor");
  const native = isCapacitorNative() ? "&native=1" : "";
  window.location.assign(
    `/auth/google?next=${encodeURIComponent(safeNext)}${native}`,
  );
  return { success: true };
}

export async function signUp(data: any) {
  const supabase = createClient();
  const { getOAuthCallbackUrl } = await import("@/lib/auth/oauth");

  const { error, data: authData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
      },
      emailRedirectTo: getOAuthCallbackUrl("/select-organization"),
    },
  });

  if (error) {
    const message = getUserErrorMessage(
      error,
      "We could not create your account. Please try again.",
    );
    toast.error(message);
    return { error: message };
  }

  toast.success("Check your email for verification link.");
  return { success: true, user: authData.user };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast.error(
      getUserErrorMessage(
        error,
        "We could not sign you out. Please try again.",
      ),
    );
  } else {
    window.location.href = "/login";
  }
}
