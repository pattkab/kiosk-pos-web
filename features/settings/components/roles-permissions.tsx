"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS, ROLE_PERMISSIONS, Role } from "@/lib/auth/permissions";
import { Check, Minus } from "lucide-react";
import { RoleBadge } from "./role-badge";

const roles: Role[] = ["owner", "admin", "manager", "cashier"];

export function RolesPermissions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles and permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              {roles.map((role) => (
                <TableHead key={role}><RoleBadge role={role} /></TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((permission) => (
              <TableRow key={permission}>
                <TableCell className="font-medium">{permission}</TableCell>
                {roles.map((role) => (
                  <TableCell key={role}>
                    {ROLE_PERMISSIONS[role].includes(permission) ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
