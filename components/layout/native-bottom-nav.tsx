"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  MoreHorizontal,
  BarChart3,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ImpactStyle } from "@capacitor/haptics";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useOrganizationStore } from "@/store/use-organization-store";
import {
  APP_NAV_ITEMS,
  NATIVE_MORE_MODULES,
  NATIVE_TAB_MODULES,
  canExploreWithoutOrganization,
  getNavItemByModule,
  hasModuleAccess,
  isNativeMoreSectionActive,
  isNavItemActive,
  type AppNavModule,
} from "@/lib/navigation/app-navigation";

const TAB_ICONS: Record<AppNavModule, LucideIcon> = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  inventory: Package,
  reports: BarChart3,
  team: Users,
  settings: Settings,
  notifications: MoreHorizontal,
};

export function NativeBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const { activeOrganization } = useActiveOrganization();
  const userRole = activeOrganization?.role;
  const permissions = useOrganizationStore((state) => state.permissions);

  const tabItems = NATIVE_TAB_MODULES.map(getNavItemByModule).filter(
    (item): item is NonNullable<typeof item> =>
      Boolean(item && hasModuleAccess(item.module, permissions, userRole))
  );

  const moreItems = NATIVE_MORE_MODULES.map(getNavItemByModule).filter(
    (item): item is NonNullable<typeof item> =>
      Boolean(item && hasModuleAccess(item.module, permissions, userRole))
  );

  const moreActive = isNativeMoreSectionActive(pathname);

  const triggerHaptic = useCallback(async (style?: ImpactStyle) => {
    try {
      const { Haptics, ImpactStyle: Style } = await import("@capacitor/haptics");
      await Haptics.impact({ style: style ?? Style.Light });
    } catch {
      /* haptics optional */
    }
  }, []);

  const guardNavigation = (
    event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    module: AppNavModule
  ) => {
    triggerHaptic();
    if (activeOrganization || canExploreWithoutOrganization(module)) return;
    event.preventDefault();
    toast.info("Create an organization to use this feature.", {
      action: {
        label: "Create",
        onClick: () => router.push("/onboarding"),
      },
    });
  };

  if (tabItems.length === 0) return null;

  return (
    <>
      {moreOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-200 native-more-backdrop"
          aria-label="Close menu"
          onClick={() => {
            triggerHaptic();
            setMoreOpen(false);
          }}
        />
      ) : null}

      {moreOpen && moreItems.length > 0 ? (
        <div
          className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom)+12px)] z-50 mx-4 rounded-3xl border bg-card/95 p-2 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300 native-more-sheet"
          role="menu"
        >
          <div className="mb-2 px-4 pt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            More Services
          </div>
          {moreItems.map((item) => {
            const Icon = TAB_ICONS[item.module];
            const active = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={(event) => {
                  guardNavigation(event, item.module);
                  setMoreOpen(false);
                }}
                className={cn(
                  "flex min-h-14 items-center gap-4 rounded-2xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.98]",
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  active ? "bg-white/20" : "bg-muted"
                )}>
                  <Icon className="h-5 w-5 shrink-0" />
                </div>
                {item.name}
              </Link>
            );
          })}
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/40 bg-card/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl native-bottom-nav"
        aria-label="Main"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
          {tabItems.map((item) => {
            const Icon = TAB_ICONS[item.module];
            const active = isNavItemActive(pathname, item.href);
            const emphasized = item.module === "pos";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(event) => guardNavigation(event, item.module)}
                className={cn(
                  "relative flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-90",
                  active
                    ? "text-primary"
                    : "text-muted-foreground",
                  emphasized && !active && "text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active && "bg-primary/10",
                    emphasized && active && "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "scale-110")} aria-hidden />
                </span>
                <span className={cn(
                  "text-[10px] font-semibold tracking-tight transition-all",
                  active ? "opacity-100" : "opacity-80"
                )}>
                  {item.shortName}
                </span>
                {active && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}

          {moreItems.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                void triggerHaptic();
                setMoreOpen((open) => !open);
              }}
              className={cn(
                "flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-90",
                moreActive || moreOpen ? "text-primary" : "text-muted-foreground"
              )}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              <span
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-all",
                  (moreActive || moreOpen) && "bg-primary/10"
                )}
              >
                <MoreHorizontal className={cn("h-5 w-5", (moreActive || moreOpen) && "scale-110")} aria-hidden />
              </span>
              <span className="text-[10px] font-semibold tracking-tight opacity-80">More</span>
            </button>
          ) : null}
        </div>
      </nav>
    </>
  );
}
