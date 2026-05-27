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
          <div className="mx-auto w-full max-w-screen-2xl p-3 sm:p-5 lg:p-8">
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
