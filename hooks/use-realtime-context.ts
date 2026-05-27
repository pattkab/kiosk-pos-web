"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";

export function useRealtimeContext() {
  const supabase = createClient();
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);

  return useQuery({
    queryKey: ["realtime-context", activeOrganizationId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (!profile) return null;

      let memberQuery = supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("profile_id", profile.id)
        .is("removed_at", null);
      if (activeOrganizationId) memberQuery = memberQuery.eq("organization_id", activeOrganizationId);
      const { data: member } = await memberQuery.maybeSingle();
      if (!member) return null;

      return {
        user,
        profile,
        organizationId: member.organization_id,
        role: member.role,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
