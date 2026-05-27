import { SettingsShell } from "@/features/settings/components/settings-shell";
import { RolesPermissions } from "@/features/settings/components/roles-permissions";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function RolesSettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <RolesPermissions />
    </SettingsShell>
  );
}
