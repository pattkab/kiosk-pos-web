"use client";

import { QueryProvider } from "./query-provider";
import { RealtimeProvider } from "./realtime-provider";
import { ThemeProvider } from "./theme-provider";
import { PwaProvider } from "./pwa-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <RealtimeProvider>
          <PwaProvider>{children}</PwaProvider>
        </RealtimeProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

