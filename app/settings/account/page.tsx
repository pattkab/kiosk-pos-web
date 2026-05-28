import { SettingsShell } from "@/features/settings/components/settings-shell";
import { UserAccountSettings } from "@/features/settings/components/user-account-settings";

export default function AccountSettingsPage() {
  return (
    <SettingsShell>
      <UserAccountSettings />
    </SettingsShell>
  );
}
