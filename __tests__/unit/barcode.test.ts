import { describe, expect, it } from "vitest";
import { isLikelyScannerBurst, normalizeScannedCode } from "@/lib/barcode";

describe("barcode helpers", () => {
  it("normalizes scanner suffix characters", () => {
    expect(normalizeScannedCode(" 012345678905\n")).toBe("012345678905");
  });

  it("accepts fast keyboard-wedge scanner bursts", () => {
    expect(
      isLikelyScannerBurst({
        code: "012345678905",
        firstKeyAt: 1000,
        lastKeyAt: 1300,
        submittedAt: 1330,
      }),
    ).toBe(true);
  });

  it("rejects slower human typing", () => {
    expect(
      isLikelyScannerBurst({
        code: "bread",
        firstKeyAt: 1000,
        lastKeyAt: 1900,
        submittedAt: 2100,
      }),
    ).toBe(false);
  });
});
