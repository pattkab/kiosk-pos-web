"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import { hasSubscriptionAccess } from "@/lib/billing/access";

const BILLING_PATH = "/settings/billing";

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();

  const onBillingPage =
    pathname === BILLING_PATH || pathname.startsWith(`${BILLING_PATH}/`);
  const allowed = hasSubscriptionAccess(settings.data);
  const isLoading =
    Boolean(activeOrganization?.id) &&
    (settings.isLoading || settings.isFetching);

  useEffect(() => {
    if (!activeOrganization?.id || isLoading || onBillingPage || allowed)
      return;
    router.replace(`${BILLING_PATH}?required=1`);
  }, [activeOrganization?.id, allowed, isLoading, onBillingPage, router]);

  if (!activeOrganization?.id) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Checking subscription...
      </div>
    );
  }

  if (!allowed && !onBillingPage) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Redirecting to billing...
      </div>
    );
  }

  return <>{children}</>;
}
