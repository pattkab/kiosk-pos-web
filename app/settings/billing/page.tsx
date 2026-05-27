import { Suspense } from "react";
import { SettingsShell } from "@/features/settings/components/settings-shell";
import { BillingSettings } from "@/features/settings/components/billing-settings";
import { checkPermission } from "@/lib/auth/server-permissions";

export default async function BillingSettingsPage() {
  await checkPermission("settings.manage");
  return (
    <SettingsShell>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading billing...</div>}>
        <BillingSettings />
      </Suspense>
    </SettingsShell>
  );
}
