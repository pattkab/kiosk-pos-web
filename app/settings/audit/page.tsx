import { SettingsShell } from "@/features/settings/components/settings-shell";
import { AuditLogView } from "@/features/settings/components/audit-log-view";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function AuditSettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <AuditLogView />
    </SettingsShell>
  );
}
