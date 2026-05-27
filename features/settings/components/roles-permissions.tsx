"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERMISSIONS, ROLE_PERMISSIONS, Permission, Role, RolePermissionMap } from "@/lib/auth/permissions";
import { Check, Minus } from "lucide-react";
import { RoleBadge } from "./role-badge";
import { useOrganizationSettings } from "@/hooks/use-organization";

const roles: Role[] = ["owner", "admin", "manager", "cashier"];
const editableRoles: Role[] = ["admin", "manager", "cashier"];

export function RolesPermissions() {
  const settings = useOrganizationSettings();
  const [draft, setDraft] = useState<RolePermissionMap>({});
  const [saved, setSaved] = useState<RolePermissionMap>({});

  useEffect(() => {
    const incoming = (settings.data?.role_permissions ?? {}) as RolePermissionMap;
    setDraft(incoming);
    setSaved(incoming);
  }, [settings.data?.role_permissions]);

  const effectivePermissions = useMemo(() => {
    const map: Record<Role, Permission[]> = {
      owner: [...PERMISSIONS],
      admin: draft.admin ?? ROLE_PERMISSIONS.admin,
      manager: draft.manager ?? ROLE_PERMISSIONS.manager,
      cashier: draft.cashier ?? ROLE_PERMISSIONS.cashier,
    };
    return map;
  }, [draft]);

  const hasChanges = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved]
  );

  const togglePermission = (role: Role, permission: Permission) => {
    if (!editableRoles.includes(role)) return;
    setDraft((current) => {
      const existing = current[role] ?? ROLE_PERMISSIONS[role];
      const next = existing.includes(permission)
        ? existing.filter((entry) => entry !== permission)
        : [...existing, permission];
      return { ...current, [role]: next };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Roles and permissions</h2>
          <p className="text-sm text-muted-foreground">
            Adjust role rights for this organization. Owner rights remain fixed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setDraft(saved)}
            disabled={!hasChanges || settings.updateSettings.isPending}
          >
            Reset
          </Button>
          <Button
            onClick={() =>
              settings.updateSettings.mutate({
                tax_rate: Number(settings.data?.tax_rate ?? 0),
                receipt_header: settings.data?.receipt_header ?? "",
                receipt_footer: settings.data?.receipt_footer ?? "",
                receipt_logo_url: settings.data?.receipt_logo_url ?? "",
                receipt_notes: settings.data?.receipt_notes ?? "",
                low_stock_threshold_default: Number(settings.data?.low_stock_threshold_default ?? 5),
                role_permissions: draft,
              })
            }
            disabled={!hasChanges || settings.updateSettings.isPending}
          >
            {settings.updateSettings.isPending ? "Saving..." : "Save rights"}
          </Button>
        </div>
      </div>
      <Card>
      <CardHeader>
        <CardTitle>Permission matrix</CardTitle>
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
                    <button
                      type="button"
                      className="rounded-md p-1 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => togglePermission(role, permission)}
                      disabled={!editableRoles.includes(role)}
                      aria-label={`Toggle ${permission} for ${role}`}
                    >
                      {effectivePermissions[role].includes(permission) ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      </Card>
    </div>
  );
}
