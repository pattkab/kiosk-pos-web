import { createClient } from "@/lib/supabase/server";
import { hasPermission, AnyPermission, RolePermissionMap } from "./permissions";
import { redirect } from "next/navigation";
import { OrganizationWithRole } from "@/hooks/use-organization";

export async function checkPermission(permission: AnyPermission, organizationId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { data: organizationRows, error } = await supabase.rpc("list_my_organizations");
  if (error) {
    redirect("/unauthorized");
  }
  const organizations = (organizationRows ?? []) as OrganizationWithRole[];

  const canInOrganization = async (organization: OrganizationWithRole) => {
    let rolePermissionMap: RolePermissionMap | null = null;
    try {
      const { data } = await supabase
        .from("organization_settings")
        .select("role_permissions")
        .eq("organization_id", organization.id)
        .maybeSingle();
      rolePermissionMap = (data?.role_permissions ?? null) as RolePermissionMap | null;
    } catch {
      rolePermissionMap = null;
    }
    return hasPermission(organization.role, permission, rolePermissionMap);
  };

  let scopedMember: OrganizationWithRole | undefined;
  if (organizationId) {
    const explicit = organizations?.find((organization) => organization.id === organizationId);
    if (explicit && (await canInOrganization(explicit))) scopedMember = explicit;
  } else {
    for (const organization of organizations ?? []) {
      if (await canInOrganization(organization)) {
        scopedMember = organization;
        break;
      }
    }
  }

  if (!scopedMember) {
    redirect("/unauthorized");
  }

  return { user, profile, member: scopedMember };
}
