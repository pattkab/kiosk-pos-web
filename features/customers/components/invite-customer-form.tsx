"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerInvitations, useInviteCustomer } from "@/hooks/use-customers";
import { Mail, Phone, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function InviteCustomerForm() {
  const inviteCustomer = useInviteCustomer();
  const invitationsQuery = useCustomerInvitations();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");

  async function handleInvite() {
    const result = await inviteCustomer.mutateAsync({
      email,
      phone,
      full_name: fullName,
    });
    const joinUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/join/customer?token=${result.token}`
        : `${resolveRequestAppUrl()}/join/customer?token=${result.token}`;
    setEmail("");
    setPhone("");
    setFullName("");
    try {
      await navigator.clipboard.writeText(joinUrl);
      toast.success("Invite link copied to clipboard.");
    } catch {
      toast.success("Customer invited. Share the join link from the list below.");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div>
        <h3 className="flex items-center gap-2 font-semibold">
          <UserPlus className="h-4 w-4" />
          Invite customer
        </h3>
        <p className="text-sm text-muted-foreground">
          Invite by email or phone. When they sign in to Kiosk POS, they receive a unique loyalty barcode automatically.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="invite-name">Name</Label>
          <Input
            id="invite-name"
            placeholder="Jane Customer"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="invite-phone">Phone</Label>
          <Input
            id="invite-phone"
            placeholder="+256..."
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      </div>

      <Button
        disabled={
          inviteCustomer.isPending ||
          (email.trim().length === 0 && phone.trim().length === 0)
        }
        onClick={() => void handleInvite()}
      >
        Send invite
      </Button>

      {(invitationsQuery.data ?? []).length > 0 ? (
        <div className="space-y-2 border-t pt-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Pending invites
          </p>
          {(invitationsQuery.data ?? [])
            .filter((invite) => !invite.accepted_at)
            .slice(0, 5)
            .map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
              >
                <span>
                  {invite.full_name || invite.email || invite.phone}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const joinUrl = `${window.location.origin}/join/customer?token=${invite.token}`;
                    void navigator.clipboard.writeText(joinUrl);
                    toast.success("Join link copied.");
                  }}
                >
                  Copy join link
                </Button>
              </div>
            ))}
        </div>
      ) : null}

      <p className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" />
          Matching email on sign-in links the card
        </span>
        <span className="inline-flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          Phone matching also works when provided
        </span>
      </p>
    </div>
  );
}
