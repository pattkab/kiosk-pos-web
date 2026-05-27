import { SettingsShell } from "@/features/settings/components/settings-shell";
import { DangerZone } from "@/features/settings/components/danger-zone";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function DangerSettingsPage() {
  await checkPermission("organization.delete");
  return (
    <SettingsShell>
      <DangerZone />
    </SettingsShell>
  );
}
