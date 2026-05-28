"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Building2,
  CreditCard,
  FileText,
  Palette,
  Receipt,
  Shield,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

const nav = [
  { href: "/settings", label: "General", icon: Building2 },
  { href: "/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/settings/roles", label: "Roles", icon: Shield },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/receipt", label: "Receipt", icon: Receipt },
  { href: "/settings/tax", label: "Tax", icon: WalletCards },
  { href: "/settings/billing", label: "Billing", icon: CreditCard },
  { href: "/settings/audit", label: "Audit logs", icon: FileText },
  { href: "/settings/danger", label: "Danger zone", icon: TriangleAlert },
];

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Organization, permissions, and audit controls.
          </p>
        </div>
        <nav className="grid gap-1 pt-4">
          {nav.map((item) => {
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
