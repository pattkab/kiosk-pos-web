import { describe, expect, it } from "vitest";
import {
  getNativePageTitle,
  hasModuleAccess,
  isNativeMoreSectionActive,
  isNavItemActive,
} from "@/lib/navigation/app-navigation";

describe("app-navigation", () => {
  it("detects active routes", () => {
    expect(isNavItemActive("/pos", "/pos")).toBe(true);
    expect(isNavItemActive("/pos/checkout", "/pos")).toBe(true);
    expect(isNavItemActive("/dashboard", "/pos")).toBe(false);
  });

  it("marks more section when on settings", () => {
    expect(isNativeMoreSectionActive("/settings/billing")).toBe(true);
    expect(isNativeMoreSectionActive("/pos")).toBe(false);
  });

  it("respects role permissions", () => {
    expect(hasModuleAccess("pos", [], "cashier")).toBe(true);
    expect(hasModuleAccess("pos", ["inventory.view"], "cashier")).toBe(false);
    expect(hasModuleAccess("pos", ["pos.access"], "cashier")).toBe(true);
    expect(hasModuleAccess("dashboard", [], "cashier")).toBe(true);
  });

  it("resolves native page titles", () => {
    expect(getNativePageTitle("/pos")).toBe("POS Checkout");
    expect(getNativePageTitle("/settings/sync")).toBe("Settings");
    expect(getNativePageTitle("/customers")).toBe("Customers");
    expect(getNativePageTitle("/pos/queue")).toBe("Offline Queue");
  });
});
