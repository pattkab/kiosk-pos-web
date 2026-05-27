"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  hasPermission,
  Permission,
  ROLE_PERMISSIONS,
  RolePermissionMap,
  Role,
  resolveRolePermissions,
} from "@/lib/auth/permissions";
import { useOrganizationStore } from "@/store/use-organization-store";
import {
  InviteMemberValues,
  OrganizationProfileValues,
  OrganizationSettingsValues,
} from "@/validators/organization";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export type OrganizationWithRole = {
  id: string;
  name: string;
  slug: string;
  business_type?: string | null;
  logo_url: string | null;
  currency: string | null;
  timezone: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_id?: string | null;
  role: Role;
  member_id: string;
};

export type OrganizationInvitation = {
  id: string;
  organization_id: string;
  name: string | null;
  email: string;
  role: Role;
  expires_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
  created_at: string | null;
  resent_at?: string | null;
  profiles?:
    | { email: string | null; full_name: string | null }
    | Array<{ email: string | null; full_name: string | null }>
    | null;
};

const organizationInvitationsKey = (organizationId?: string | null) =>
  ["organization-invitations", organizationId] as const;

function removeInvitationFromCachedLists(
  queryClient: QueryClient,
  invitationId: string,
) {
  queryClient.setQueriesData<OrganizationInvitation[]>(
    { queryKey: ["organization-invitations"] },
    (current) =>
      current?.filter((entry) => entry.id !== invitationId) ?? current,
  );
}

export function useOrganizations() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_my_organizations");
      if (error) throw error;

      return (data ?? []) as OrganizationWithRole[];
    },
  });
}

export function useActiveOrganization() {
  const organizations = useOrganizations();
  const {
    activeOrganizationId,
    setActiveOrganizationId,
    setActiveCurrency,
    setPermissionState,
  } = useOrganizationStore();
  const queryClient = useQueryClient();
  const activeOrganization =
    organizations.data?.find((org) => org.id === activeOrganizationId) ??
    organizations.data?.[0] ??
    null;

  useEffect(() => {
    const applyPermissions = async () => {
      if (!activeOrganization) return;
      let rolePermissionMap: RolePermissionMap | null = null;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("organization_settings")
          .select("role_permissions")
          .eq("organization_id", activeOrganization.id)
          .maybeSingle();
        rolePermissionMap = (data?.role_permissions ??
          null) as RolePermissionMap | null;
      } catch {
        rolePermissionMap = null;
      }
      setPermissionState(
        activeOrganization.role,
        resolveRolePermissions(activeOrganization.role, rolePermissionMap),
      );
    };

    if (activeOrganization && activeOrganization.id !== activeOrganizationId) {
      setActiveOrganizationId(activeOrganization.id);
    }
    if (activeOrganization) {
      setActiveCurrency(activeOrganization.currency);
      setPermissionState(
        activeOrganization.role,
        ROLE_PERMISSIONS[activeOrganization.role],
      );
      void applyPermissions();
    }
  }, [
    activeOrganization,
    activeOrganizationId,
    setActiveCurrency,
    setActiveOrganizationId,
    setPermissionState,
  ]);

  const switchOrganization = (organizationId: string) => {
    const organization = organizations.data?.find(
      (entry) => entry.id === organizationId,
    );
    setActiveOrganizationId(organizationId);
    setActiveCurrency(organization?.currency);
    if (organization) {
      setPermissionState(
        organization.role,
        ROLE_PERMISSIONS[organization.role],
      );
    }
    queryClient.invalidateQueries();
  };

  return {
    ...organizations,
    organizations: organizations.data ?? [],
    activeOrganization,
    switchOrganization,
  };
}

export function useOrganization() {
  const active = useActiveOrganization();
  return { organization: active.activeOrganization, loading: active.isLoading };
}

export function usePermissions() {
  const { role, permissions } = useOrganizationStore();
  return {
    role,
    permissions,
    can: (permission: Permission) =>
      Boolean(role && permissions.includes(permission)),
  };
}

export function useOrganizationMembers() {
  const supabase = createClient();
  const { activeOrganization } = useActiveOrganization();

  return useQuery({
    queryKey: ["organization-members", activeOrganization?.id],
    enabled: Boolean(activeOrganization?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select(
          "id, role, created_at, last_active_at, profiles(id, email, full_name, avatar_url)",
        )
        .eq("organization_id", activeOrganization!.id)
        .is("removed_at", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOrganizationInvitations() {
  const supabase = createClient();
  const { activeOrganization } = useActiveOrganization();

  return useQuery({
    queryKey: organizationInvitationsKey(activeOrganization?.id),
    enabled: Boolean(activeOrganization?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("*, profiles!invitations_invited_by_fkey(email, full_name)")
        .eq("organization_id", activeOrganization!.id)
        .is("accepted_at", null)
        .is("cancelled_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrganizationInvitation[];
    },
  });
}

export function useInviteMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useMutation({
    mutationFn: async (values: InviteMemberValues) => {
      if (!activeOrganization) throw new Error("No active organization.");
      const { data, error } = await supabase.rpc("invite_organization_member", {
        p_organization_id: activeOrganization.id,
        p_name: values.name,
        p_email: values.email,
        p_role: values.role,
      });
      if (error) throw error;

      const invitation = Array.isArray(data) ? data[0] : null;
      const invitationId = invitation?.invitation_id as string | undefined;
      const invitationUrl = invitation?.invitation_url as string | undefined;

      if (!invitationId) {
        throw new Error(
          "Invitation created but invitation id was not returned.",
        );
      }

      const response = await fetch("/api/invitations/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitationId,
          organizationId: activeOrganization.id,
        }),
      });

      const emailResult = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      return {
        invitationId,
        invitationUrl,
        emailSent: Boolean(response.ok && emailResult.ok),
        emailError:
          response.ok && emailResult.ok
            ? null
            : (emailResult.error ??
              "Invitation created but email delivery failed."),
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: organizationInvitationsKey(activeOrganization?.id),
      });
      if (data.emailSent) {
        toast.success("Invitation email sent", {
          description: data.invitationUrl ?? undefined,
        });
        return;
      }
      toast.warning("Invitation created, but email failed", {
        description: data.emailError ?? data.invitationUrl ?? undefined,
      });
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRevokeInvitation() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      if (!activeOrganization) throw new Error("No active organization.");
      const { data, error } = await supabase.rpc(
        "revoke_organization_invitation",
        {
          p_invitation_id: invitationId,
        },
      );
      if (error) throw error;
      return (data as string) ?? invitationId;
    },
    onMutate: async (invitationId) => {
      const queryKey = organizationInvitationsKey(activeOrganization?.id);
      await queryClient.cancelQueries({ queryKey });
      const previousLists = queryClient.getQueriesData<
        OrganizationInvitation[]
      >({
        queryKey: ["organization-invitations"],
      });
      removeInvitationFromCachedLists(queryClient, invitationId);
      return { previousLists, queryKey };
    },
    onError: (error, _invitationId, context) => {
      context?.previousLists?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error(error.message);
    },
    onSuccess: (_id, _invitationId, context) => {
      removeInvitationFromCachedLists(queryClient, _invitationId);
      queryClient.invalidateQueries({
        queryKey:
          context?.queryKey ??
          organizationInvitationsKey(activeOrganization?.id),
      });
      toast.success("Invitation revoked");
    },
  });
}

export function useUpdateMemberRole() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: Role;
    }) => {
      if (!activeOrganization) throw new Error("No active organization.");
      const { error } = await supabase.rpc("update_member_role", {
        p_organization_id: activeOrganization.id,
        p_member_id: memberId,
        p_role: role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast.success("Role updated");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useRemoveMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!activeOrganization) throw new Error("No active organization.");
      const { error } = await supabase.rpc("remove_organization_member", {
        p_organization_id: activeOrganization.id,
        p_member_id: memberId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast.success("Member removed");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useOrganizationSettings() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { activeOrganization } = useActiveOrganization();

  const query = useQuery({
    queryKey: ["organization-settings", activeOrganization?.id],
    enabled: Boolean(activeOrganization?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", activeOrganization!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (values: OrganizationProfileValues) => {
      if (!activeOrganization) throw new Error("No active organization.");
      const { error } = await supabase
        .from("organizations")
        .update(values)
        .eq("id", activeOrganization.id);
      if (error) throw error;
      if (values.business_type !== activeOrganization.business_type) {
        await supabase.rpc("seed_default_categories_for_organization", {
          p_organization_id: activeOrganization.id,
          p_business_type: values.business_type,
        });
      }
      await supabase.rpc("write_audit_log", {
        p_organization_id: activeOrganization.id,
        p_action: "UPDATE_ORGANIZATION",
        p_entity_type: "organization",
        p_entity_id: activeOrganization.id,
        p_metadata: values,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateSettings = useMutation({
    mutationFn: async (values: OrganizationSettingsValues) => {
      if (!activeOrganization) throw new Error("No active organization.");
      const { error } = await supabase
        .from("organization_settings")
        .upsert(
          { organization_id: activeOrganization.id, ...values },
          { onConflict: "organization_id" },
        );
      if (error) throw error;
      await supabase.rpc("write_audit_log", {
        p_organization_id: activeOrganization.id,
        p_action: "UPDATE_SETTINGS",
        p_entity_type: "organization_settings",
        p_entity_id: activeOrganization.id,
        p_metadata: values,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast.success("Settings updated");
    },
    onError: (error) => toast.error(error.message),
  });

  return { ...query, updateProfile, updateSettings };
}

export function useAuditLogs() {
  const supabase = createClient();
  const { activeOrganization } = useActiveOrganization();

  return useQuery({
    queryKey: ["audit-logs", activeOrganization?.id],
    enabled: Boolean(activeOrganization?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*, profiles(email, full_name)")
        .eq("organization_id", activeOrganization!.id)
        .order("created_at", { ascending: false })
        .limit(250);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDeleteOrganization() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { activeOrganization } = useActiveOrganization();
  const { clearOrganizationState } = useOrganizationStore();

  return useMutation({
    mutationFn: async () => {
      if (!activeOrganization) throw new Error("No active organization.");
      const { error } = await supabase.rpc("delete_organization_soft", {
        p_organization_id: activeOrganization.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      clearOrganizationState();
      queryClient.invalidateQueries();
      toast.success("Organization deleted");
      router.push("/select-organization");
    },
    onError: (error) => toast.error(error.message),
  });
}
