import { describe, it, expect } from 'vitest';
import { hasPermission, canAccessModule } from '@/lib/auth/permissions';

describe('Permissions Logic', () => {
  it('correctly identifies permissions for owner', () => {
    expect(hasPermission('owner', 'DELETE_ORGANIZATION')).toBe(true);
    expect(hasPermission('owner', 'MANAGE_TEAM')).toBe(true);
    expect(hasPermission('owner', 'CREATE_SALE')).toBe(true);
  });

  it('correctly restricts cashier permissions', () => {
    expect(hasPermission('cashier', 'DELETE_ORGANIZATION')).toBe(false);
    expect(hasPermission('cashier', 'MANAGE_TEAM')).toBe(false);
    expect(hasPermission('cashier', 'CREATE_SALE')).toBe(true);
  });

  it('correctly handles module access', () => {
    expect(canAccessModule('owner', 'settings')).toBe(true);
    expect(canAccessModule('admin', 'inventory')).toBe(true);
    expect(canAccessModule('cashier', 'pos')).toBe(true);
    expect(canAccessModule('cashier', 'team')).toBe(false);
    expect(canAccessModule('manager', 'reports')).toBe(true);
  });
});
