import { SettingsShell } from "@/features/settings/components/settings-shell";
import { SyncSettings } from "@/features/settings/components/sync-settings";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function SyncSettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <SyncSettings />
    </SettingsShell>
  );
}
