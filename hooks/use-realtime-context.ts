"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";
import { ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { OrganizationWithRole } from "@/hooks/use-organization";

export function useRealtimeContext() {
  const supabase = createClient();
  const activeOrganizationId = useOrganizationStore((state) => state.activeOrganizationId);
  const setActiveOrganizationId = useOrganizationStore((state) => state.setActiveOrganizationId);
  const setActiveCurrency = useOrganizationStore((state) => state.setActiveCurrency);
  const setPermissionState = useOrganizationStore((state) => state.setPermissionState);

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

      const { data: organizationRows, error } = await supabase.rpc("list_my_organizations");
      if (error) throw error;
      const organizations = (organizationRows ?? []) as OrganizationWithRole[];

      const organization =
        organizations?.find((entry) => entry.id === activeOrganizationId) ?? organizations?.[0] ?? null;
      if (!organization) return null;

      if (organization.id !== activeOrganizationId) setActiveOrganizationId(organization.id);
      setActiveCurrency(organization.currency);
      setPermissionState(organization.role, ROLE_PERMISSIONS[organization.role]);

      return {
        user,
        profile,
        organizationId: organization.id,
        role: organization.role,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
