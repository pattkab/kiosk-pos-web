import { describe, expect, it } from "vitest";
import {
  formatLoyaltyCardNumber,
  isLoyaltyCardCode,
  loyaltyCardPayload,
  normalizeLoyaltyCardNumber,
} from "@/lib/loyalty/card";

describe("loyalty card helpers", () => {
  it("normalizes scanned card codes", () => {
    expect(normalizeLoyaltyCardNumber(" kpos-ab12c-de34f ")).toBe(
      "KPOSAB12CDE34F",
    );
  });

  it("detects valid loyalty card codes", () => {
    expect(isLoyaltyCardCode("KPOS-AB12C-DE34F")).toBe(true);
    expect(isLoyaltyCardCode("KPOSAB12CDE34F")).toBe(true);
    expect(isLoyaltyCardCode("1234567890")).toBe(false);
    expect(isLoyaltyCardCode("KPOS123")).toBe(false);
  });

  it("formats card numbers for display", () => {
    expect(formatLoyaltyCardNumber("KPOSAB12CDE34F")).toBe(
      "KPOS-AB12C-DE34F",
    );
  });

  it("returns normalized payload for scanners", () => {
    expect(loyaltyCardPayload("KPOS-AB12C-DE34F")).toBe("KPOSAB12CDE34F");
  });
});
