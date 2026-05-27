import { Database } from "@/types/database";

export type Role = Database["public"]["Enums"]["user_role"];

export const PERMISSIONS = [
  "organization.manage",
  "organization.delete",
  "team.manage",
  "inventory.view",
  "inventory.create",
  "inventory.update",
  "inventory.delete",
  "inventory.adjust",
  "pos.access",
  "pos.checkout",
  "reports.view",
  "reports.export",
  "notifications.manage",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [...PERMISSIONS],
  admin: PERMISSIONS.filter((permission) => permission !== "organization.delete"),
  manager: [
    "inventory.view",
    "inventory.create",
    "inventory.update",
    "inventory.adjust",
    "pos.access",
    "pos.checkout",
    "reports.view",
    "reports.export",
    "notifications.manage",
  ],
  cashier: ["pos.access", "pos.checkout"],
};

const LEGACY_PERMISSION_MAP = {
  CREATE_SALE: "pos.checkout",
  VOID_SALE: "pos.checkout",
  APPLY_DISCOUNT: "pos.checkout",
  MANAGE_INVENTORY: "inventory.adjust",
  VIEW_REPORTS: "reports.view",
  MANAGE_TEAM: "team.manage",
  MANAGE_SETTINGS: "settings.manage",
  DELETE_ORGANIZATION: "organization.delete",
} as const;

export type LegacyPermission = keyof typeof LEGACY_PERMISSION_MAP;
export type AnyPermission = Permission | LegacyPermission;

export function normalizePermission(permission: AnyPermission): Permission {
  return (LEGACY_PERMISSION_MAP as Record<string, Permission>)[permission] ?? (permission as Permission);
}

export function hasPermission(role: Role, permission: AnyPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(normalizePermission(permission));
}

export function canAccessModule(role: Role, module: string): boolean {
  switch (module) {
    case "dashboard":
      return true;
    case "pos":
      return hasPermission(role, "pos.access");
    case "inventory":
      return hasPermission(role, "inventory.view");
    case "reports":
      return hasPermission(role, "reports.view");
    case "notifications":
      return true;
    case "team":
      return hasPermission(role, "team.manage");
    case "settings":
      return hasPermission(role, "settings.manage");
    default:
      return false;
  }
}
