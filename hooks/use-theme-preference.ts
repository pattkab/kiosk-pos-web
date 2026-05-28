"use client";

import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

export type ThemePreference = "light" | "dark" | "system";

export function useThemePreference() {
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  const setThemePreference = async (value: ThemePreference) => {
    setTheme(value);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    await supabase
      .from("profiles")
      .update({ theme_preference: value })
      .eq("auth_user_id", user.id);
  };

  return {
    theme: (theme as ThemePreference | undefined) ?? "system",
    setThemePreference,
  };
}
