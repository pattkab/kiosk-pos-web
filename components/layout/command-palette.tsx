"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  Cloud,
  CreditCard,
  Gift,
  FileText,
  Settings,
  Smile,
  User,
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Bell,
  Users,
  UserRoundSearch,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAppStore } from "@/store/use-app-store";

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, toggleSidebar } = useAppStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen, toggleSidebar]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setCommandPaletteOpen(false);
      command();
    },
    [setCommandPaletteOpen]
  );

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/pos"))}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>POS Checkout</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/inventory"))}>
            <Package className="mr-2 h-4 w-4" />
            <span>Inventory</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/reports"))}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Reports</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/invoices"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Invoices</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/customers"))}>
            <UserRoundSearch className="mr-2 h-4 w-4" />
            <span>Customers</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/pos/queue"))}>
            <Cloud className="mr-2 h-4 w-4" />
            <span>Offline Queue</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/notifications"))}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push("/team"))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Team Management</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings/loyalty"))}>
            <Gift className="mr-2 h-4 w-4" />
            <span>Loyalty settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings/account"))}>
            <User className="mr-2 h-4 w-4" />
            <span>My account</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
