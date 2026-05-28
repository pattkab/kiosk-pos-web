"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";

export function ThemeSyncProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { setTheme } = useTheme();

  useEffect(() => {
    const applyProfileTheme = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("theme_preference")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (data?.theme_preference) {
        setTheme(data.theme_preference);
      }
    };

    void applyProfileTheme();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void applyProfileTheme();
      }
    });

    return () => subscription.unsubscribe();
  }, [setTheme, supabase]);

  return <>{children}</>;
}
