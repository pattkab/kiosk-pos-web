"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, User, ChevronDown } from "lucide-react";
import { getNativePageTitle } from "@/lib/navigation/app-navigation";
import { useActiveOrganization } from "@/hooks/use-organization";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NativeHeader() {
  const pathname = usePathname();
  const title = getNativePageTitle(pathname);
  const { activeOrganization } = useActiveOrganization();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/select-organization" className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg shadow-sm">
              {activeOrganization?.name?.charAt(0) || "K"}
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold tracking-tight leading-none">{title}</h1>
              {activeOrganization && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px]">
                    {activeOrganization.name}
                  </span>
                  <ChevronDown className="h-2 w-2 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90">
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          <Link
            href="/notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/account"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90"
          >
            <User className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}
