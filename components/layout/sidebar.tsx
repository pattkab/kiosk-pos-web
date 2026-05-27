"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { Permission } from "@/lib/auth/permissions";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useOrganizationStore } from "@/store/use-organization-store";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { name: "POS Checkout", href: "/pos", icon: ShoppingCart, module: "pos" },
  { name: "Inventory", href: "/inventory", icon: Package, module: "inventory" },
  { name: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
  { name: "Team", href: "/team", icon: Users, module: "team" },
  { name: "Settings", href: "/settings", icon: Settings, module: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useAppStore();
  const { activeOrganization } = useActiveOrganization();
  const userRole = activeOrganization?.role;
  const permissions = useOrganizationStore((state) => state.permissions);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = sidebarOpen || (isDesktop && isHovered);

  const hasModuleAccess = (module: string) => {
    if (!userRole) return true;
    const modulePermission: Record<string, Permission | null> = {
      dashboard: null,
      pos: "pos.access",
      inventory: "inventory.view",
      reports: "reports.view",
      notifications: null,
      team: "team.manage",
      settings: "settings.manage",
    };
    const required = modulePermission[module];
    return required ? permissions.includes(required) : true;
  };

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
          {navigation
            .filter((item) => hasModuleAccess(item.module))
            .map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                >
                  <item.icon
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
