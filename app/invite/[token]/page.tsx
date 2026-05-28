"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type InvitationRecord = {
  token: string;
  email: string;
  name: string | null;
  role: string;
  organizations: { name: string } | Array<{ name: string }> | null;
};

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const supabase = createClient();
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const setActiveOrganizationId = useOrganizationStore((state) => state.setActiveOrganizationId);

  useEffect(() => {
    async function fetchInvitation() {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("token, email, name, role, organizations(name)")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        toast.error("Invalid or expired invitation");
        router.push("/login");
        return;
      }

      const invitationData = data as unknown as InvitationRecord;
      setInvitation(invitationData);
      setFullName(invitationData.name ?? "");
      setLoading(false);
    }

    async function fetchCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUserEmail(user?.email?.toLowerCase() ?? null);
    }

    fetchInvitation();
    fetchCurrentUser();
  }, [router, supabase, token]);

  async function acceptInvitation() {
    const { data, error } = await supabase.rpc("accept_organization_invitation", { p_token: token });

    if (error || !data) throw new Error(error?.message ?? "Failed to accept invitation.");
    const orgName = Array.isArray(invitation?.organizations)
      ? invitation?.organizations[0]?.name
      : invitation?.organizations?.name;
    setActiveOrganizationId(data as string);
    toast.success(`Joined ${orgName ?? "organization"}`);
    router.push("/dashboard");
  }

  async function handleAccept() {
    setProcessing(true);
    try {
      await acceptInvitation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept invitation.");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSetPasswordAndContinue() {
    if (!invitation) return;

    if (fullName.trim().length < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/invitations/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName: fullName.trim(),
          password,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        email?: string;
      };

      if (!response.ok || !result.ok || !result.email) {
        throw new Error(result.error ?? "Failed to activate invitation.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: result.email,
        password,
      });
      if (signInError) throw signInError;

      await acceptInvitation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to finish invitation setup.");
    } finally {
      setProcessing(false);
    }
  }

  async function signOutAndSwitchAccount() {
    setProcessing(true);
    try {
      await supabase.auth.signOut();
      setAuthUserEmail(null);
      toast.info("Signed out. Set your password for the invited account.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading invitation...</div>;
  }

  const invitedEmail = invitation?.email?.toLowerCase() ?? null;
  const organizationName = Array.isArray(invitation?.organizations)
    ? invitation?.organizations[0]?.name
    : invitation?.organizations?.name;
  const invitationRole = invitation?.role ?? "team member";
  const signedInAsInvitedUser = Boolean(authUserEmail && invitedEmail && authUserEmail === invitedEmail);
  const signedInAsDifferentUser = Boolean(authUserEmail && invitedEmail && authUserEmail !== invitedEmail);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join organization</CardTitle>
          <CardDescription>
            You have been invited to join <strong>{organizationName}</strong> as a{" "}
            <strong>{invitationRole}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            Invitation email: <strong>{invitation?.email}</strong>
          </div>

          {signedInAsDifferentUser ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are signed in as <strong>{authUserEmail}</strong>. Sign out to continue with the invited account.
              </p>
              <Button className="w-full" variant="outline" onClick={signOutAndSwitchAccount} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Switching account...
                  </>
                ) : (
                  "Sign out and continue"
                )}
              </Button>
            </div>
          ) : signedInAsInvitedUser ? (
            <Button className="w-full" onClick={handleAccept} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Accept invitation"
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Set your password to activate this invited account and continue.
              </p>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                />
              </div>
              <Button className="w-full" onClick={handleSetPasswordAndContinue} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Set password and continue"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
