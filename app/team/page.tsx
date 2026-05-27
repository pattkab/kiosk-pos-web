import { TeamManagement } from "@/features/settings/components/team-management";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function TeamPage() {
  await checkPermission("team.manage");
  return <TeamManagement />;
}
