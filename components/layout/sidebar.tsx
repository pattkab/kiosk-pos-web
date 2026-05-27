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
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
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

  // Handle mobile resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 md:static",
          sidebarOpen ? "w-64" : "w-0 -translate-x-full md:w-20 md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/dashboard" className={cn("flex items-center gap-2 font-bold text-primary", !sidebarOpen && "md:mx-auto")}>
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black">K</div>
            {sidebarOpen && <span className="text-xl">Kiosk POS</span>}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navigation.filter(item => hasModuleAccess(item.module)).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  !sidebarOpen && "md:justify-center"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    sidebarOpen && "mr-3",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3", !sidebarOpen && "md:justify-center px-0")}
            onClick={toggleSidebar}
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", !sidebarOpen && "rotate-180")} />
            {sidebarOpen && <span>Collapse</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
