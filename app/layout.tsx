import "./globals.css";
import { Providers } from "@/providers";
import { Toaster } from "@/components/ui/sonner";
import { ConflictResolutionModal } from "@/components/realtime/conflict-resolution-modal";
import { AcknowledgementModal } from "@/features/notifications/components/acknowledgement-modal";
import { OAuthErrorHandler } from "@/components/auth/oauth-error-handler";
import { GlobalProgressIndicator } from "@/components/ui/global-progress-indicator";
import { rootMetadata } from "@/lib/seo/metadata";
import { NativeShellBootstrap } from "@/components/native/native-shell-bootstrap";

export const metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NativeShellBootstrap />
        <Providers>
          <OAuthErrorHandler />
          <GlobalProgressIndicator />
          {children}
          <ConflictResolutionModal />
          <AcknowledgementModal />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
