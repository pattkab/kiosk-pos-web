import type { Permission } from "@/lib/auth/permissions";

export type AppNavModule =
  | "dashboard"
  | "pos"
  | "inventory"
  | "reports"
  | "team"
  | "settings"
  | "notifications";

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
  return NATIVE_MORE_MODULES.some((module) => {
    const item = getNavItemByModule(module);
    return item ? isNavItemActive(pathname, item.href) : false;
  });
}

export function getNativePageTitle(pathname: string): string {
  const item = APP_NAV_ITEMS.find((nav) => isNavItemActive(pathname, nav.href));
  if (item) return item.name;
  if (pathname.startsWith("/settings/")) return "Settings";
  if (pathname.startsWith("/notifications")) return "Notifications";
  return "Kiosk POS";
}
