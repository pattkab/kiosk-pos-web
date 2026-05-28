"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { UserProfileValues } from "@/validators/profile";

export type CurrentProfile = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  theme_preference: "light" | "dark" | "system";
};

export const currentProfileKey = ["current-profile"] as const;

export function useCurrentProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: currentProfileKey,
    queryFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("You must be signed in.");

      await supabase.rpc("ensure_profile_for_current_user");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, auth_user_id, email, full_name, phone, avatar_url, theme_preference")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Profile could not be found.");

      return {
        ...data,
        email: data.email ?? user.email ?? "",
      } as CurrentProfile;
    },
  });
}

export function useUpdateCurrentProfile() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: UserProfileValues) => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("You must be signed in.");

      const avatarUrl = values.avatar_url?.trim() || null;
      const fullName = values.full_name.trim();
      const phone = values.phone?.trim() || null;

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone,
          avatar_url: avatarUrl,
        })
        .eq("auth_user_id", user.id)
        .select("id, auth_user_id, email, full_name, phone, avatar_url, theme_preference")
        .single();

      if (error) throw error;

      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      });

      return data as CurrentProfile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(currentProfileKey, profile);
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast.success("Account updated");
    },
    onError: (error) => toast.error(error.message),
  });
}
