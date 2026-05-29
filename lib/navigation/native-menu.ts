import type { AppNavModule } from "@/lib/navigation/app-navigation";

export type NativeMenuItem = {
  href: string;
  label: string;
  module?: AppNavModule;
  /** Routes that should highlight this item */
  matchPrefixes?: string[];
};

export type NativeMenuSection = {
  title: string;
  items: NativeMenuItem[];
};

export const NATIVE_MENU_SECTIONS: NativeMenuSection[] = [
  {
    title: "Shop floor",
    items: [
      { href: "/pos", label: "POS Checkout", module: "pos" },
      { href: "/pos/queue", label: "Offline queue", matchPrefixes: ["/pos/queue"] },
      { href: "/dashboard", label: "Dashboard", module: "dashboard" },
      { href: "/inventory", label: "Inventory", module: "inventory" },
    ],
  },
  {
    title: "Customers & team",
    items: [
      { href: "/customers", label: "Customers", matchPrefixes: ["/customers"] },
      { href: "/invoices", label: "Invoices", matchPrefixes: ["/invoices"] },
      { href: "/reports", label: "Reports", module: "reports", matchPrefixes: ["/reports"] },
      { href: "/team", label: "Team", module: "team" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/notifications", label: "Notifications", module: "notifications", matchPrefixes: ["/notifications"] },
      { href: "/settings/account", label: "My account", matchPrefixes: ["/settings/account"] },
      { href: "/settings", label: "Settings", module: "settings", matchPrefixes: ["/settings"] },
      { href: "/select-organization", label: "Switch organization", matchPrefixes: ["/select-organization"] },
    ],
  },
];

export function isNativeMenuItemActive(pathname: string, item: NativeMenuItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  return (item.matchPrefixes ?? []).some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
