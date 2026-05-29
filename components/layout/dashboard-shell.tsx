"use client";

import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { CommandPalette } from "./command-palette";
import { Breadcrumbs } from "./breadcrumbs";
import { ConnectivityBanner } from "./connectivity-banner";
import { ConflictModal } from "../realtime/conflict-modal";
import { SubscriptionGate } from "@/components/billing/subscription-gate";
import { NativeBottomNav } from "./native-bottom-nav";
import { NativeHeader } from "./native-header";
import { NativeMenuSheet } from "./native-menu-sheet";
import { GlobalReceiptModal } from "@/features/receipts/components/global-receipt-modal";
import { useNativeShell } from "@/hooks/use-native-shell";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isNative } = useNativeShell();

  return (
    <div
      className="flex h-dvh overflow-hidden bg-background"
      data-native-splash-anchor="app-shell"
    >
      {!isNative ? <Sidebar /> : null}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ConnectivityBanner />
        {isNative ? <NativeHeader /> : <Navbar />}
        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden",
            isNative && "pb-native-nav",
          )}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-screen-2xl flex-1 flex-col min-h-0",
              isNative ? "px-3 py-2" : "px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-8",
            )}
          >
            {!isNative ? <Breadcrumbs /> : null}
            <SubscriptionGate>{children}</SubscriptionGate>
          </div>
        </main>
      </div>
      {isNative ? (
        <>
          <NativeMenuSheet />
          <NativeBottomNav />
        </>
      ) : null}
      <CommandPalette />
      <ConflictModal />
      <GlobalReceiptModal />
    </div>
  );
}
