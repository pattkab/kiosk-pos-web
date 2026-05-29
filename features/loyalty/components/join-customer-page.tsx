"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAcceptCustomerInvitation } from "@/hooks/use-my-loyalty";
import Link from "next/link";
import { Gift } from "lucide-react";

export function JoinCustomerPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const acceptInvitation = useAcceptCustomerInvitation();

  useEffect(() => {
    if (!token || acceptInvitation.isSuccess) return;
    void acceptInvitation.mutateAsync(token).catch(() => undefined);
  }, [acceptInvitation, token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Join loyalty program
          </CardTitle>
          <CardDescription>
            Accept your shop invitation to get a personal loyalty card you can scan at checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!token ? (
            <p className="text-sm text-muted-foreground">
              This link is missing an invitation token. Ask the shop to resend your invite.
            </p>
          ) : acceptInvitation.isPending ? (
            <p className="text-sm text-muted-foreground">Linking your account…</p>
          ) : acceptInvitation.isSuccess ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your loyalty card is ready. Open it on this device to scan at checkout.
              </p>
              <Button asChild className="w-full">
                <Link href="/my-loyalty">Open my loyalty card</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-destructive">
                {acceptInvitation.error instanceof Error
                  ? acceptInvitation.error.message
                  : "Could not accept this invitation."}
              </p>
              <Button
                className="w-full"
                onClick={() => token && acceptInvitation.mutate(token)}
              >
                Try again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
