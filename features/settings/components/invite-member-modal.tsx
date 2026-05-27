"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInviteMember } from "@/hooks/use-organization";
import { useTeamStore } from "@/store/use-team-store";
import {
  inviteMemberSchema,
  InviteMemberValues,
} from "@/validators/organization";
import { Loader2, MailPlus } from "lucide-react";

export function InviteMemberModal() {
  const { inviteOpen, setInviteOpen } = useTeamStore();
  const invite = useInviteMember();
  const form = useForm<InviteMemberValues>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { name: "", email: "", role: "cashier" },
  });

  const handleOpenChange = (open: boolean) => {
    setInviteOpen(open);
    if (!open) {
      invite.reset();
      form.reset({ name: "", email: "", role: "cashier" });
    }
  };

  return (
    <Dialog open={inviteOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send a time-limited invite and choose the role they should receive
            after accepting.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) =>
            invite.mutate(values, { onSuccess: () => setInviteOpen(false) }),
          )}
        >
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              type="text"
              placeholder="e.g. Adrian Namutebi"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="name@store.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(role: InviteMemberValues["role"]) =>
                form.setValue("role", role)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="h-11 w-full font-bold" disabled={invite.isPending}>
            {invite.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending invitation...
              </>
            ) : (
              <>
                <MailPlus className="mr-2 h-4 w-4" />
                Send invitation
              </>
            )}
          </Button>
          {invite.isSuccess && invite.data?.emailSent && (
            <p className="text-sm text-emerald-600">
              Invitation email sent successfully.
            </p>
          )}
          {invite.isSuccess && !invite.data?.emailSent && (
            <p className="text-sm text-amber-600">
              Invitation was created, but email delivery failed.{" "}
              {invite.data?.invitationUrl ?? ""}
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
