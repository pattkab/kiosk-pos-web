import { describe, expect, it } from "vitest";
import {
  getReadableForeground,
  hexToHslParts,
  normalizeHexColor,
} from "@/lib/appearance";

describe("appearance helpers", () => {
  it("normalizes valid hex colors", () => {
    expect(normalizeHexColor("2563EB", "#000000")).toBe("#2563eb");
  });

  it("falls back for invalid colors", () => {
    expect(normalizeHexColor("blue", "#2563eb")).toBe("#2563eb");
  });

  it("converts hex to hsl parts for css variables", () => {
    expect(hexToHslParts("#2563eb")).toBe("221 83% 53%");
  });

  it("chooses readable foreground colors", () => {
    expect(getReadableForeground("#ffffff")).toBe("222.2 47.4% 11.2%");
    expect(getReadableForeground("#111827")).toBe("210 40% 98%");
  });
});
