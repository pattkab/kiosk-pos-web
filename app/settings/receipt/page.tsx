import { SettingsShell } from "@/features/settings/components/settings-shell";
import { OrganizationOperationalSettings } from "@/features/settings/components/organization-operational-settings";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function ReceiptSettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <OrganizationOperationalSettings mode="receipt" />
    </SettingsShell>
  );
}
