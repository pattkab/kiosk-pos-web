"use client";

import { QueryProvider } from "./query-provider";
import { RealtimeProvider } from "./realtime-provider";
import { ThemeProvider } from "./theme-provider";
import { PwaProvider } from "./pwa-provider";
import { AppearanceProvider } from "./appearance-provider";
import { ThemeSyncProvider } from "./theme-sync-provider";
import { CapacitorBootstrap } from "@/components/native/capacitor-bootstrap";
import { PosKioskBootstrap } from "@/components/native/pos-kiosk-bootstrap";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeSyncProvider>
        <QueryProvider>
          <AppearanceProvider>
            <RealtimeProvider>
              <PwaProvider>
                <CapacitorBootstrap />
                <PosKioskBootstrap />
                {children}
              </PwaProvider>
            </RealtimeProvider>
          </AppearanceProvider>
        </QueryProvider>
      </ThemeSyncProvider>
    </ThemeProvider>
  );
}
