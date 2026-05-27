"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationStore } from "@/store/use-organization-store";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const supabase = createClient();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const setActiveOrganizationId = useOrganizationStore((state) => state.setActiveOrganizationId);

  useEffect(() => {
    async function fetchInvitation() {
      const { data, error } = await supabase
        .from("organization_invitations")
        .select("*, organizations(name)")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        toast.error("Invalid or expired invitation");
        router.push("/login");
        return;
      }

      setInvitation(data);
      setLoading(false);
    }
    fetchInvitation();
  }, [router, supabase, token]);

  async function handleAccept() {
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/register?next=/invite/${token}`);
      return;
    }

    const { data, error } = await supabase.rpc("accept_organization_invitation", { p_token: token });
    setProcessing(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setActiveOrganizationId(data as string);
    toast.success(`Joined ${invitation.organizations.name}`);
    router.push("/dashboard");
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading invitation...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Join organization</CardTitle>
          <CardDescription>
            You have been invited to join <strong>{invitation.organizations.name}</strong> as a{" "}
            <strong>{invitation.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleAccept} disabled={processing}>
            {processing ? "Joining..." : "Accept invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
