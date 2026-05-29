import { SettingsShell } from "@/features/settings/components/settings-shell";
import { DeviceSettings } from "@/features/settings/components/device-settings";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function DeviceSettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <DeviceSettings />
    </SettingsShell>
  );
}
