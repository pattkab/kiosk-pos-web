import { describe, expect, it } from "vitest";
import {
  getNativeOAuthCallbackUrl,
  resolveNativeDeepLink,
} from "@/lib/auth/native-oauth";

describe("native OAuth / deep links", () => {
  it("builds custom scheme callback URL", () => {
    expect(getNativeOAuthCallbackUrl("/pos")).toBe(
      "kioskpos://auth/callback?next=%2Fpos"
    );
  });

  it("maps auth callback deep link to in-app path", () => {
    expect(
      resolveNativeDeepLink(
        "kioskpos://auth/callback?code=abc&next=%2Fselect-organization"
      )
    ).toBe("/auth/callback?code=abc&next=%2Fselect-organization");
  });

  it("maps open shortcuts to routes", () => {
    expect(resolveNativeDeepLink("kioskpos://open/pos")).toBe("/pos");
  });
});
