"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  X,
  Pin,
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useOrganizationStore } from "@/store/use-organization-store";
import { toast } from "sonner";
import {
  APP_NAV_ITEMS,
  canExploreWithoutOrganization,
  hasModuleAccess,
  isNavItemActive,
} from "@/lib/navigation/app-navigation";
import { useNativeShell } from "@/hooks/use-native-shell";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  inventory: Package,
  reports: BarChart3,
  team: Users,
  settings: Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isNative } = useNativeShell();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const { activeOrganization } = useActiveOrganization();
  const userRole = activeOrganization?.role;
  const permissions = useOrganizationStore((state) => state.permissions);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = sidebarOpen || (isDesktop && isHovered);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const applyLayout = (desktop: boolean) => {
      setIsDesktop(desktop);
      if (!desktop) {
        setSidebarOpen(false);
        setIsHovered(false);
      }
    };

    applyLayout(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => applyLayout(event.matches);
    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, [setSidebarOpen]);

  useEffect(() => {
    if (!isDesktop) setSidebarOpen(false);
  }, [isDesktop, pathname, setSidebarOpen]);

  if (isNative) return null;

  return (
    <>
      {sidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        onMouseEnter={() => isDesktop && setIsHovered(true)}
        onMouseLeave={() => isDesktop && setIsHovered(false)}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-[width,transform,box-shadow] duration-200 ease-out",
          !isDesktop && (sidebarOpen ? "translate-x-0 shadow-xl w-[82vw] max-w-xs" : "-translate-x-full w-[82vw] max-w-xs"),
          isDesktop && [
            "static translate-x-0",
            isExpanded ? "w-64 shadow-lg" : "w-[4.5rem]",
          ]
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b px-3",
            isExpanded ? "justify-between" : "justify-center md:justify-center"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 overflow-hidden font-bold text-primary",
              !isExpanded && "md:justify-center"
            )}
            title="Kiosk POS"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground">
              K
            </div>
            {isExpanded ? <span className="truncate text-xl">Kiosk POS</span> : null}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
          {APP_NAV_ITEMS.filter((item) =>
            hasModuleAccess(item.module, permissions, userRole)
          ).map((item) => {
            const Icon = NAV_ICONS[item.module as keyof typeof NAV_ICONS];
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isExpanded ? item.name : undefined}
                className={cn(
                  "group flex items-center rounded-lg py-2.5 text-sm font-medium transition-all",
                  isExpanded ? "px-3" : "justify-center px-0 md:px-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={(event) => {
                  if (
                    activeOrganization ||
                    canExploreWithoutOrganization(item.module)
                  ) {
                    return;
                  }

                  event.preventDefault();
                  toast.info("Create an organization to use this feature.", {
                    action: {
                      label: "Create",
                      onClick: () => router.push("/onboarding"),
                    },
                  });
                }}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isExpanded && "mr-3",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                />
                {isExpanded ? <span className="truncate">{item.name}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden shrink-0 border-t p-2 md:block">
          <Button
            variant="ghost"
            className={cn(
              "w-full gap-3",
              isExpanded ? "justify-start" : "justify-center px-0"
            )}
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Pin sidebar open"}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5 shrink-0" />
            ) : (
              <Pin className="h-5 w-5 shrink-0" />
            )}
            {isExpanded ? (
              <span>{sidebarOpen ? "Collapse" : "Pin open"}</span>
            ) : null}
          </Button>
        </div>
      </aside>
    </>
  );
}
