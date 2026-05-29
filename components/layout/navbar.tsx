"use client";

import Link from "next/link";
import { Moon, Sun, Search, Menu, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";
import { OrgSwitcher } from "./org-switcher";
import { NotificationCenter } from "./notification-center";
import { useAppStore } from "@/store/use-app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PresenceAvatars } from "@/components/realtime/presence-avatars";
import { SyncStatusBadge } from "@/components/realtime/sync-status-badge";
import { OfflineBanner } from "./offline-banner";
import { getProfileInitials } from "@/lib/avatar-presets";
import { useCurrentProfile } from "@/hooks/use-profile";
import { useThemePreference } from "@/hooks/use-theme-preference";
import { useNativeShell } from "@/hooks/use-native-shell";
import { usePathname } from "next/navigation";
import { getNativePageTitle } from "@/lib/navigation/app-navigation";

export function Navbar() {
  const { setThemePreference } = useThemePreference();
  const { isNative } = useNativeShell();
  const pathname = usePathname();
  const { toggleSidebar, setCommandPaletteOpen } = useAppStore();
  const { data: profile } = useCurrentProfile();
  const displayName = profile?.full_name || "Account";
  const email = profile?.email ?? "";
  const initials = getProfileInitials(profile?.full_name, profile?.email);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <OfflineBanner />
      <div className="flex min-h-14 items-center justify-between gap-2 px-2 py-2 sm:min-h-16 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          {!isNative ? (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5 md:hidden" />
              <PanelLeft className="hidden h-5 w-5 md:block" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          ) : null}
          {isNative ? (
            <p className="truncate text-base font-semibold leading-tight">
              {getNativePageTitle(pathname)}
            </p>
          ) : null}
          <OrgSwitcher />
        </div>

        <div className="hidden flex-1 items-center justify-center px-2 sm:flex md:justify-end">
          <Button
            variant="outline"
            className="relative h-9 w-full justify-start text-sm text-muted-foreground md:w-64"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden lg:block">
            <PresenceAvatars />
          </div>
          <div className={isNative ? "block" : "hidden sm:block"}>
            <SyncStatusBadge />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:hidden"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
          <div className="shrink-0">
            <NotificationCenter />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hidden h-9 w-9 sm:inline-flex"
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setThemePreference("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemePreference("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setThemePreference("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={profile?.avatar_url ?? ""}
                    alt={displayName}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/account">Account settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/select-organization">Switch organization</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Organization settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => signOut()}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
