"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell, Menu, Search, User } from "lucide-react";
import {
  getNativeBackHref,
  getNativePageTitle,
} from "@/lib/navigation/app-navigation";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

export function NativeHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const title = getNativePageTitle(pathname);
  const backHref = getNativeBackHref(pathname);
  const { activeOrganization } = useActiveOrganization();
  const setNativeMenuOpen = useAppStore((state) => state.setNativeMenuOpen);
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen);

  return (
    <header className="native-app-bar sticky top-0 z-40 w-full shrink-0 border-b border-border/40 bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-3">
        {backHref ? (
          <button
            type="button"
            aria-label="Go back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90"
            onClick={() => setNativeMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link
          href="/select-organization"
          className="flex min-w-0 flex-1 items-center gap-2 active:opacity-70"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            {activeOrganization?.name?.charAt(0) || "K"}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold leading-tight tracking-tight">
              {title}
            </h1>
            {activeOrganization ? (
              <p className="truncate text-[10px] font-medium text-muted-foreground">
                {activeOrganization.name}
              </p>
            ) : null}
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5">
          {backHref ? (
            <button
              type="button"
              aria-label="Open menu"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90"
              onClick={() => setNativeMenuOpen(true)}
            >
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Search"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          <Link
            href="/notifications"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90",
              pathname.startsWith("/notifications") && "bg-primary/10",
            )}
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link
            href="/settings/account"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-accent active:scale-90",
              pathname.startsWith("/settings/account") && "bg-primary/10",
            )}
          >
            <User className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}
