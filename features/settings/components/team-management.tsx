"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrganizationInvitations, useOrganizationMembers, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-organization";
import { Role } from "@/lib/auth/permissions";
import { useTeamStore } from "@/store/use-team-store";
import { UserPlus, Trash2 } from "lucide-react";
import { InviteMemberModal } from "./invite-member-modal";
import { RoleBadge } from "./role-badge";

export function TeamManagement() {
  const members = useOrganizationMembers();
  const invitations = useOrganizationInvitations();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const { setInviteOpen } = useTeamStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team</h2>
          <p className="text-muted-foreground">Invite teammates, manage roles, and review pending invitations.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent>
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
              {(members.data ?? []).map((member: any) => {
                const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{profile?.full_name ?? "Unnamed user"}</TableCell>
                    <TableCell>{profile?.email}</TableCell>
                    <TableCell>
                      {member.role === "owner" ? (
                        <RoleBadge role={member.role} />
                      ) : (
                        <Select value={member.role} onValueChange={(role: Role) => updateRole.mutate({ memberId: member.id, role })}>
                          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>{member.last_active_at ? new Date(member.last_active_at).toLocaleString() : "Not recorded"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeMember.mutate(member.id)} disabled={member.role === "owner"}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pending invitations</CardTitle></CardHeader>
        <CardContent>
          {(invitations.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invitations.</p>
          ) : (
            <div className="space-y-3">
              {(invitations.data ?? []).map((invitation: any) => (
                <div key={invitation.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.role} - expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <RoleBadge role={invitation.role} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InviteMemberModal />
    </div>
  );
}
