"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Bell,
  Users,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { Button } from "@/components/ui/button";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { canAccessModule } from "@/lib/auth/permissions";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { name: "POS", href: "/pos", icon: ShoppingCart, module: "pos" },
  { name: "Inventory", href: "/inventory", icon: Package, module: "inventory" },
  { name: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
  { name: "Notifications", href: "/notifications", icon: Bell, module: "notifications" },
  { name: "Team", href: "/team", icon: Users, module: "team" },
  { name: "Settings", href: "/settings", icon: Settings, module: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const [userRole, setUserRole] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).single();
        if (profile) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('role')
            .eq('profile_id', profile.id)
            .single();
          setUserRole(member?.role);
        }
      }
    }
    getRole();
  }, [supabase]);

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        {sidebarOpen && (
          <span className="text-xl font-bold text-primary">Kiosk POS</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(!sidebarOpen && "mx-auto")}
        >
          <ChevronLeft
            className={cn("h-5 w-5 transition-transform", !sidebarOpen && "rotate-180")}
          />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.filter(item => !userRole || canAccessModule(userRole, item.module)).map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                !sidebarOpen && "justify-center"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  sidebarOpen && "mr-3",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                )}
              />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
