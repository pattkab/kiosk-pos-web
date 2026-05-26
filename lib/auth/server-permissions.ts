import { createClient } from "@/lib/supabase/server";
import { hasPermission, Permission } from "./permissions";
import { redirect } from "next/navigation";

export async function checkPermission(permission: Permission) {
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
    .select("role")
    .eq("profile_id", profile.id)
    .single();

  if (!member || !hasPermission(member.role, permission)) {
    redirect("/unauthorized");
  }

  return { user, profile, member };
}
