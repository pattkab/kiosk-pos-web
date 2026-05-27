import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";
import { Toaster } from "@/components/ui/sonner";
import { ConflictResolutionModal } from "@/components/realtime/conflict-resolution-modal";
import { AcknowledgementModal } from "@/features/notifications/components/acknowledgement-modal";

export const metadata: Metadata = {
  title: "Kiosk POS",
  description: "Modern POS and Inventory Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <ConflictResolutionModal />
          <AcknowledgementModal />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
