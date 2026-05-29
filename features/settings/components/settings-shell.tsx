"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNativeShell } from "@/hooks/use-native-shell";
import {
  Bell,
  Building2,
  Cloud,
  CreditCard,
  FileText,
  Gift,
  Palette,
  Receipt,
  Shield,
  Smartphone,
  TriangleAlert,
  UserRound,
  WalletCards,
} from "lucide-react";

const nav = [
  { href: "/settings/account", label: "Account", icon: UserRound },
  { href: "/settings", label: "General", icon: Building2 },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/roles", label: "Roles", icon: Shield },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/receipt", label: "Receipt", icon: Receipt },
  { href: "/settings/loyalty", label: "Loyalty", icon: Gift },
  { href: "/settings/tax", label: "Tax", icon: WalletCards },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/sync", label: "Offline sync", icon: Cloud },
  { href: "/settings/device", label: "Device & app", icon: Smartphone, nativeOnly: true },
  { href: "/settings/audit", label: "Audit logs", icon: FileText },
  { href: "/settings/danger", label: "Danger zone", icon: TriangleAlert },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isNative } = useNativeShell();

  const visibleNav = nav.filter((item) => !item.nativeOnly || isNative);

  if (isNative) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Account, organization, and operating controls.
          </p>
        </div>
        <nav className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                size="sm"
                variant={active ? "default" : "outline"}
                className={cn("shrink-0 rounded-full", !active && "bg-background")}
              >
                <Link href={item.href}>
                  <Icon className="mr-1.5 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Account, organization, and operating controls.
          </p>
        </div>
        <nav className="grid gap-1 pt-4">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                variant={active ? "default" : "ghost"}
                className={cn(
                  "justify-start",
                  !active && "text-muted-foreground",
                )}
              >
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
