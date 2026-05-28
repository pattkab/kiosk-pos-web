"use client";

import { createClient } from "@/lib/supabase/client";
import {
  loginSchema,
  signupSchema,
  type LoginFormValues,
} from "@/validators/auth";
import { toast } from "sonner";

export async function signIn(data: LoginFormValues) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    toast.error(error.message);
    return { error: error.message };
  }

  await supabase.rpc("ensure_profile_for_current_user");

  toast.success("Successfully signed in!");
  return { success: true };
}

export async function signInWithGoogle(next = "/select-organization") {
  const supabase = createClient();
  const { getOAuthCallbackUrl } = await import("@/lib/auth/oauth");
  const redirectTo = getOAuthCallbackUrl(next);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    toast.error(error.message);
    return { error: error.message };
  }

  return { success: true };
}

export async function signUp(data: any) {
  const supabase = createClient();

  const { error, data: authData } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
      },
    },
  });

  if (error) {
    toast.error(error.message);
    return { error: error.message };
  }

  toast.success("Check your email for verification link.");
  return { success: true, user: authData.user };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast.error(error.message);
  } else {
    window.location.href = "/login";
  }
}
