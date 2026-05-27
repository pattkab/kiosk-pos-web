"use client";

import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { CommandPalette } from "./command-palette";
import { Breadcrumbs } from "./breadcrumbs";
import { ConnectivityBanner } from "./connectivity-banner";
import { ConflictModal } from "../realtime/conflict-modal";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ConnectivityBanner />
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-screen-2xl px-3 py-3 sm:px-5 sm:py-5 lg:px-8 lg:py-8">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
      <ConflictModal />
    </div>
  );
}
