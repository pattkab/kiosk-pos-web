import { Database } from "@/types/database";

type Role = Database['public']['Enums']['user_role'];

const PERMISSIONS = {
  // POS Permissions
  CREATE_SALE: ['owner', 'admin', 'manager', 'cashier'],
  VOID_SALE: ['owner', 'admin', 'manager'],
  APPLY_DISCOUNT: ['owner', 'admin', 'manager'],

  // Inventory Permissions
  MANAGE_INVENTORY: ['owner', 'admin', 'manager'],
  VIEW_REPORTS: ['owner', 'admin', 'manager'],

  // Admin Permissions
  MANAGE_TEAM: ['owner', 'admin'],
  MANAGE_SETTINGS: ['owner', 'admin'],
  DELETE_ORGANIZATION: ['owner'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function canAccessModule(role: Role, module: string): boolean {
  switch (module) {
    case 'pos':
      return true; // Everyone can access POS
    case 'inventory':
    case 'reports':
      return ['owner', 'admin', 'manager'].includes(role);
    case 'team':
    case 'settings':
      return ['owner', 'admin'].includes(role);
    default:
      return false;
  }
}
