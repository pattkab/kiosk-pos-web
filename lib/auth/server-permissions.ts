import { createClient } from "@/lib/supabase/server";
import { hasPermission, AnyPermission } from "./permissions";
import { redirect } from "next/navigation";

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

  const { data: member } = await supabase
    .from("organization_members")
    .select("role, organization_id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  let scopedMember = member;
  if (organizationId) {
    const { data } = await supabase
      .from("organization_members")
      .select("role, organization_id")
      .eq("profile_id", profile.id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    scopedMember = data;
  }

  if (!scopedMember || !hasPermission(scopedMember.role, permission)) {
    redirect("/unauthorized");
  }

  return { user, profile, member: scopedMember };
}
