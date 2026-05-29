"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  BarChart3,
  Bell,
  Building2,
  Cloud,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  UserRound,
  Users,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useOrganizationStore } from "@/store/use-organization-store";
import {
  isNativeMenuItemActive,
  NATIVE_MENU_SECTIONS,
  type NativeMenuItem,
} from "@/lib/navigation/native-menu";
import {
  canExploreWithoutOrganization,
  getNavItemByModule,
  hasModuleAccess,
  type AppNavModule,
} from "@/lib/navigation/app-navigation";

const MENU_ICONS: Record<string, LucideIcon> = {
  "/pos": ShoppingCart,
  "/pos/queue": Cloud,
  "/dashboard": LayoutDashboard,
  "/inventory": Package,
  "/customers": UserRoundSearch,
  "/reports": BarChart3,
  "/team": Users,
  "/notifications": Bell,
  "/settings/account": UserRound,
  "/settings": Settings,
  "/select-organization": Building2,
};

function canAccessMenuItem(
  item: NativeMenuItem,
  permissions: ReturnType<typeof useOrganizationStore.getState>["permissions"],
  userRole?: string | null,
) {
  if (!item.module) return true;
  return hasModuleAccess(item.module, permissions, userRole);
}

export function NativeMenuSheet() {
  const pathname = usePathname();
  const router = useRouter();
  const nativeMenuOpen = useAppStore((state) => state.nativeMenuOpen);
  const setNativeMenuOpen = useAppStore((state) => state.setNativeMenuOpen);
  const { activeOrganization } = useActiveOrganization();
  const userRole = activeOrganization?.role;
  const permissions = useOrganizationStore((state) => state.permissions);

  const closeMenu = useCallback(() => setNativeMenuOpen(false), [setNativeMenuOpen]);

  const guardNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    item: NativeMenuItem,
  ) => {
    if (activeOrganization || !item.module || canExploreWithoutOrganization(item.module)) {
      closeMenu();
      return;
    }
    event.preventDefault();
    toast.info("Create an organization to use this feature.", {
      action: {
        label: "Create",
        onClick: () => router.push("/onboarding"),
      },
    });
  };

  if (!nativeMenuOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 animate-in fade-in duration-200"
        aria-label="Close menu"
        onClick={closeMenu}
      />
      <div
        className="fixed inset-x-0 top-0 z-[70] max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)))] overflow-hidden rounded-b-3xl border-b bg-card shadow-2xl animate-in slide-in-from-top-4 duration-300 native-menu-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="App menu"
      >
        <div className="border-b px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Kiosk POS
              </p>
              <p className="text-sm font-semibold">
                {activeOrganization?.name ?? "Menu"}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent"
              onClick={closeMenu}
            >
              Close
            </button>
          </div>
        </div>

        <div className="max-h-[calc(85dvh-5rem-env(safe-area-inset-top))] overflow-y-auto p-3 pb-6">
          {NATIVE_MENU_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) =>
              canAccessMenuItem(item, permissions, userRole),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="mb-4 last:mb-0">
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
                <div className="grid gap-1">
                  {visibleItems.map((item) => {
                    const Icon = MENU_ICONS[item.href] ?? Settings;
                    const active = isNativeMenuItemActive(pathname, item);
                    const navItem = item.module
                      ? getNavItemByModule(item.module as AppNavModule)
                      : undefined;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(event) => guardNavigation(event, item)}
                        className={cn(
                          "flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98]",
                          active
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-accent/60",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl",
                            active ? "bg-white/20" : "bg-muted",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                        </span>
                        <span>{navItem?.name ?? item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
