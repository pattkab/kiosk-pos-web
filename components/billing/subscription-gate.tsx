"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useActiveOrganization,
  useOrganizationSettings,
} from "@/hooks/use-organization";
import { hasFeatureAccess, hasSubscriptionAccess } from "@/lib/billing/access";
import {
  getRequiredPlanForFeature,
  type SubscriptionFeature,
} from "@/lib/billing/plans";

const BILLING_PATH = "/settings/billing";
const PLAN_GATED_ROUTES: Array<{
  path: string;
  feature: SubscriptionFeature;
}> = [
  { path: "/pos/queue", feature: "offlineSync" },
  { path: "/reports", feature: "reports" },
  { path: "/team", feature: "team" },
  { path: "/settings/roles", feature: "advancedPermissions" },
  { path: "/settings/notifications", feature: "notifications" },
  { path: "/settings/appearance", feature: "advancedBranding" },
  { path: "/settings/audit", feature: "auditLogs" },
];

function getRouteFeature(pathname: string) {
  return PLAN_GATED_ROUTES.find(
    (route) => pathname === route.path || pathname.startsWith(`${route.path}/`),
  )?.feature;
}

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeOrganization } = useActiveOrganization();
  const settings = useOrganizationSettings();

  const onBillingPage =
    pathname === BILLING_PATH || pathname.startsWith(`${BILLING_PATH}/`);
  const subscriptionAllowed = hasSubscriptionAccess(settings.data);
  const routeFeature = getRouteFeature(pathname);
  const planAllowed = routeFeature
    ? hasFeatureAccess(settings.data, routeFeature)
    : true;
  const allowed = subscriptionAllowed && planAllowed;
  const isLoading =
    Boolean(activeOrganization?.id) &&
    (settings.isLoading || settings.isFetching);

  useEffect(() => {
    if (!activeOrganization?.id || isLoading || onBillingPage || allowed)
      return;

    if (!subscriptionAllowed) {
      router.replace(`${BILLING_PATH}?required=1`);
      return;
    }

    if (routeFeature) {
      const requiredPlan = getRequiredPlanForFeature(routeFeature);
      router.replace(
        `${BILLING_PATH}?requiredPlan=${requiredPlan}&feature=${routeFeature}`,
      );
    }
  }, [
    activeOrganization?.id,
    allowed,
    isLoading,
    onBillingPage,
    routeFeature,
    router,
    subscriptionAllowed,
  ]);

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
