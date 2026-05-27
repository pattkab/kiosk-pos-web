"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useOrganizationInvitations,
  useOrganizationMembers,
  useRemoveMember,
  useRevokeInvitation,
  useUpdateMemberRole,
  type OrganizationInvitation,
} from "@/hooks/use-organization";
import { Role } from "@/lib/auth/permissions";
import { useTeamStore } from "@/store/use-team-store";
import {
  AlertCircle,
  Clock,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { InviteMemberModal } from "./invite-member-modal";
import { RoleBadge } from "./role-badge";

type OrganizationMember = {
  id: string;
  role: Role;
  created_at?: string | null;
  last_active_at?: string | null;
  profiles?:
    | {
        id?: string;
        email?: string | null;
        full_name?: string | null;
        avatar_url?: string | null;
      }
    | Array<{
        id?: string;
        email?: string | null;
        full_name?: string | null;
        avatar_url?: string | null;
      }>
    | null;
};

export function TeamManagement() {
  const members = useOrganizationMembers();
  const invitations = useOrganizationInvitations();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const revokeInvitation = useRevokeInvitation();
  const { setInviteOpen } = useTeamStore();
  const memberRows = (members.data ?? []) as OrganizationMember[];
  const invitationRows = (invitations.data ?? []) as OrganizationInvitation[];
  const managerCount = memberRows.filter((member) =>
    ["owner", "admin", "manager"].includes(member.role),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Team</h2>
          <p className="text-muted-foreground">
            Keep access tidy with active members, pending invitations, and clear
            roles.
          </p>
        </div>
        <Button
          className="h-10 shrink-0 font-bold"
          onClick={() => setInviteOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite teammate
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-bold">Active members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-black">{memberRows.length}</p>
            <p className="text-xs text-muted-foreground">
              People who can access this workspace
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-bold">
              Privileged roles
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-black">{managerCount}</p>
            <p className="text-xs text-muted-foreground">
              Owner, admin, and manager seats
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-sm font-bold">Pending invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-black">{invitationRows.length}</p>
            <p className="text-xs text-muted-foreground">
              Unaccepted, unexpired invitations
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Update roles or remove access when a teammate leaves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.isLoading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading team members...
            </div>
          ) : members.isError ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Unable to load team members.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberRows.map((member) => {
                    const profile = Array.isArray(member.profiles)
                      ? member.profiles[0]
                      : member.profiles;
                    return (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {profile?.full_name ?? "Unnamed user"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {profile?.email ?? "No email"}
                        </TableCell>
                        <TableCell>
                          {member.role === "owner" ? (
                            <RoleBadge role={member.role} />
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(role: Role) =>
                                updateRole.mutate({ memberId: member.id, role })
                              }
                              disabled={updateRole.isPending}
                            >
                              <SelectTrigger className="h-9 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="cashier">Cashier</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {member.last_active_at
                            ? new Date(member.last_active_at).toLocaleString()
                            : "Not recorded"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Remove ${profile?.email ?? "this member"} from the team?`,
                                )
                              )
                                return;
                              removeMember.mutate(member.id);
                            }}
                            disabled={
                              member.role === "owner" || removeMember.isPending
                            }
                            aria-label={`Remove ${profile?.email ?? "member"}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>
            Revoked, accepted, and expired invitations are hidden from this
            list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.isLoading ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading invitations...
            </div>
          ) : invitations.isError ? (
            <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Unable to load invitations.
            </div>
          ) : invitationRows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="font-semibold">No pending invitations</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New invites will appear here until they are accepted or revoked.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitationRows.map((invitation) => {
                const inviter = Array.isArray(invitation.profiles)
                  ? invitation.profiles[0]
                  : invitation.profiles;
                return (
                  <div
                    key={invitation.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {invitation.name || "Unnamed invite"}
                        </p>
                        <RoleBadge role={invitation.role} />
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {invitation.email}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Expires{" "}
                          {new Date(invitation.expires_at).toLocaleDateString()}
                        </Badge>
                        {inviter?.email ? (
                          <span>
                            Invited by {inviter.full_name ?? inviter.email}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="h-9 shrink-0 gap-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Revoke invitation for ${invitation.email}?`,
                          )
                        )
                          return;
                        revokeInvitation.mutate(invitation.id);
                      }}
                      disabled={revokeInvitation.isPending}
                    >
                      {revokeInvitation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Revoke
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal />
    </div>
  );
}
