"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gift, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CustomerWalletShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/my-loyalty" className="flex items-center gap-2 font-semibold">
            <Gift className="h-5 w-5 text-primary" />
            Kiosk POS Loyalty
          </Link>
          <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      {children}
    </div>
  );
}
