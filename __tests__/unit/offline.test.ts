import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  formatLastSyncLabel,
  getCatalogStaleDays,
} from "@/lib/offline/offline-metadata";
import {
  generateOfflineReceiptNumber,
  isOfflineReceiptNumber,
} from "@/lib/offline/receipt-number";
import { getDeviceId } from "@/lib/offline/device-id";

vi.mock("@/lib/storage/db", () => {
  const metadata = new Map<string, unknown>();
  return {
    getMetadata: vi.fn(async (key: string) => metadata.get(key) ?? null),
    saveMetadata: vi.fn(async (key: string, value: unknown) => {
      metadata.set(key, value);
    }),
    putInStore: vi.fn(),
    getAllFromStore: vi.fn(async () => []),
    clearStore: vi.fn(),
    deleteFromStore: vi.fn(),
  };
});

describe("offline helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("generates stable OFF receipt numbers with daily sequence", async () => {
    const first = await generateOfflineReceiptNumber("org-1", "Main Register");
    const second = await generateOfflineReceiptNumber("org-1", "Main Register");
    expect(first).toMatch(/^OFF-MAINRE-\d{8}-0001$/);
    expect(second).toMatch(/^OFF-MAINRE-\d{8}-0002$/);
    expect(isOfflineReceiptNumber(first)).toBe(true);
  });

  it("persists a device id in local storage", () => {
    const a = getDeviceId();
    const b = getDeviceId();
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it("detects stale catalog sync age", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(getCatalogStaleDays(threeDaysAgo)).toBe(3);
    expect(formatLastSyncLabel(null)).toBe("Never synced");
  });
});
