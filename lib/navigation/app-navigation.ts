import type { Permission } from "@/lib/auth/permissions";

export type AppNavModule =
  | "dashboard"
  | "pos"
  | "inventory"
  | "reports"
  | "team"
  | "settings"
  | "notifications"
  | "customers";

export interface AppNavItem {
  name: string;
  /** Short label for bottom navigation */
  shortName: string;
  href: string;
  module: AppNavModule;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { name: "Dashboard", shortName: "Home", href: "/dashboard", module: "dashboard" },
  { name: "POS Checkout", shortName: "POS", href: "/pos", module: "pos" },
  { name: "Inventory", shortName: "Stock", href: "/inventory", module: "inventory" },
  { name: "Reports", shortName: "Reports", href: "/reports", module: "reports" },
  { name: "Team", shortName: "Team", href: "/team", module: "team" },
  { name: "Customers", shortName: "Customers", href: "/customers", module: "customers" },
  { name: "Settings", shortName: "Settings", href: "/settings", module: "settings" },
];

/** Bottom bar tabs (POS-first for shop floor use). */
export const NATIVE_TAB_MODULES: AppNavModule[] = [
  "pos",
  "dashboard",
  "inventory",
];

/** Items surfaced from the “More” tab on native. */
export const NATIVE_MORE_MODULES: AppNavModule[] = [
  "reports",
  "customers",
  "team",
  "settings",
];

const MODULE_PERMISSIONS: Record<AppNavModule, Permission | null> = {
  dashboard: null,
  pos: "pos.access",
  inventory: "inventory.view",
  reports: "reports.view",
  notifications: null,
  team: "team.manage",
  settings: "settings.manage",
  customers: null,
};

export function hasModuleAccess(
  module: AppNavModule,
  permissions: Permission[],
  userRole?: string | null
): boolean {
  if (!userRole) return true;
  const required = MODULE_PERMISSIONS[module];
  if (!required) return true;
  // Permissions hydrate after org load; don't hide primary nav while still empty.
  if (permissions.length === 0) return true;
  return permissions.includes(required);
}

export function canExploreWithoutOrganization(module: AppNavModule): boolean {
  return module === "dashboard";
}

export function getNavItemByModule(module: AppNavModule): AppNavItem | undefined {
  return APP_NAV_ITEMS.find((item) => item.module === module);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNativeMoreSectionActive(pathname: string): boolean {
  if (
    pathname.startsWith("/customers") ||
    pathname.startsWith("/pos/queue") ||
    pathname.startsWith("/select-organization")
  ) {
    return true;
  }

  return NATIVE_MORE_MODULES.some((module) => {
    const item = getNavItemByModule(module);
    return item ? isNavItemActive(pathname, item.href) : false;
  });
}

export function getNativePageTitle(pathname: string): string {
  if (pathname.startsWith("/pos/queue")) return "Offline Queue";
  if (pathname.startsWith("/customers")) return "Customers";
  if (pathname.startsWith("/select-organization")) return "Organizations";
  if (pathname.startsWith("/my-loyalty")) return "My Loyalty";
  if (pathname.startsWith("/settings/account")) return "Account";

  const item = APP_NAV_ITEMS.find((nav) => isNavItemActive(pathname, nav.href));
  if (item) return item.name;
  if (pathname.startsWith("/settings/")) return "Settings";
  if (pathname.startsWith("/notifications")) return "Notifications";
  return "Kiosk POS";
}

export function getNativeBackHref(pathname: string): string | null {
  if (pathname.startsWith("/settings/") && pathname !== "/settings") {
    return "/settings";
  }
  if (pathname.startsWith("/reports/") && pathname !== "/reports") {
    return "/reports";
  }
  if (pathname === "/pos/queue") return "/pos";
  if (pathname.startsWith("/notifications/")) return "/notifications";
  return null;
}
