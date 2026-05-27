import { SettingsShell } from "@/features/settings/components/settings-shell";
import { GeneralSettings } from "@/features/settings/components/general-settings";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function SettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <GeneralSettings />
    </SettingsShell>
  );
}
