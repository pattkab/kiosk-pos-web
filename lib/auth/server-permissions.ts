import { createClient } from "@/lib/supabase/server";
import { hasPermission, AnyPermission } from "./permissions";
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

  const scopedMember = organizationId
    ? organizations?.find((organization) => organization.id === organizationId)
    : organizations?.find((organization) => hasPermission(organization.role, permission));

  if (!scopedMember || !hasPermission(scopedMember.role, permission)) {
    redirect("/unauthorized");
  }

  return { user, profile, member: scopedMember };
}
