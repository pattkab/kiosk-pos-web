import { SettingsShell } from "@/features/settings/components/settings-shell";
import { AppearanceSettings } from "@/features/settings/components/appearance-settings";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function AppearanceSettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <AppearanceSettings />
    </SettingsShell>
  );
}
