"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AcceptInvitePage() {
  const { token } = useParams();
  const router = useRouter();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchInvitation() {
      const { data, error } = await supabase
        .from("invitations")
        .select("*, organizations(name)")
        .eq("token", token)
        .single();

      if (error || !data) {
        toast.error("Invalid or expired invitation");
        router.push("/login");
      } else {
        setInvitation(data);
      }
      setLoading(false);
    }
    fetchInvitation();
  }, [token, supabase, router]);

  async function handleAccept() {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/register?next=/invite/${token}`);
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('id').eq('auth_user_id', user.id).single();
      if (!profile) throw new Error("Profile not found");

      // 1. Add as member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: invitation.organization_id,
          profile_id: profile.id,
          role: invitation.role,
        });

      if (memberError) throw memberError;

      // 2. Delete invitation
      await supabase.from("invitations").delete().eq("id", invitation.id);

      toast.success(`Joined ${invitation.organizations.name}!`);
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div>Loading invitation...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitation.organizations.name}</strong> as a <strong>{invitation.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleAccept} disabled={processing}>
            {processing ? "Joining..." : "Accept Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
