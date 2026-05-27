import { SettingsShell } from "@/features/settings/components/settings-shell";
import { NotificationSettingsPage } from "@/features/notifications/components/notification-settings-page";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function NotificationSettingsPageRoute() {
  await checkPermission("notifications.manage");
  return (
    <SettingsShell>
      <NotificationSettingsPage />
    </SettingsShell>
  );
}
