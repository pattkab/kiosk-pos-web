import { describe, expect, it, beforeEach } from "vitest";
import {
  clearSavedPrinter,
  getSavedPrinter,
  savePrinter,
} from "@/lib/native/printer-storage";

describe("printer-storage", () => {
  beforeEach(() => {
    clearSavedPrinter();
  });

  it("saves and loads printer by MAC address", () => {
    savePrinter({ address: "AA:BB:CC:11:22:33", name: "RP80" });
    expect(getSavedPrinter()).toEqual({
      address: "AA:BB:CC:11:22:33",
      name: "RP80",
    });
  });

  it("returns null when unset", () => {
    expect(getSavedPrinter()).toBeNull();
  });
});
