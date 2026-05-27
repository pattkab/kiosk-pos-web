import { SettingsShell } from "@/features/settings/components/settings-shell";
import { TeamManagement } from "@/features/settings/components/team-management";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function SettingsTeamPage() {
  await checkPermission("team.manage");
  return (
    <SettingsShell>
      <TeamManagement />
    </SettingsShell>
  );
}
