import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  evaluateAppReviewEligibility,
  type AppReviewState,
} from "@/lib/native/app-review";
import {
  getAppStoreUrl,
  getNativeStoreReviewUrl,
  getPlayStoreUrl,
} from "@/lib/native/app-store";

const baseState = (overrides: Partial<AppReviewState> = {}): AppReviewState => ({
  firstSeenAt: "2026-01-01T00:00:00.000Z",
  completedCheckouts: 0,
  sessionDays: [],
  lastPromptAt: null,
  ratedAt: null,
  neverAskAgain: false,
  ...overrides,
});

describe("app store urls", () => {
  it("builds Play Store url from package id", () => {
    expect(getPlayStoreUrl()).toContain("shop.kioskpos.app");
  });

  it("builds platform-specific review urls", () => {
    expect(getNativeStoreReviewUrl("android")).toContain("play.google.com");
    expect(getAppStoreUrl()).toContain("apps.apple.com");
  });
});

describe("evaluateAppReviewEligibility", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T12:00:00.000Z"));
  });

  it("allows manual prompts even when milestones are not met", () => {
    const result = evaluateAppReviewEligibility(baseState(), "manual");
    expect(result.eligible).toBe(true);
  });

  it("blocks when user opted out permanently", () => {
    const result = evaluateAppReviewEligibility(
      baseState({ neverAskAgain: true }),
      "manual",
    );
    expect(result.eligible).toBe(false);
  });

  it("requires minimum checkouts for checkout trigger", () => {
    expect(
      evaluateAppReviewEligibility(
        baseState({ completedCheckouts: 4 }),
        "checkout_success",
      ).eligible,
    ).toBe(false);

    expect(
      evaluateAppReviewEligibility(
        baseState({ completedCheckouts: 5 }),
        "checkout_success",
      ).eligible,
    ).toBe(true);
  });

  it("requires distinct session days for session trigger", () => {
    expect(
      evaluateAppReviewEligibility(
        baseState({ sessionDays: ["2026-05-28", "2026-05-29"] }),
        "session_milestone",
      ).eligible,
    ).toBe(false);

    expect(
      evaluateAppReviewEligibility(
        baseState({
          sessionDays: ["2026-05-28", "2026-05-29", "2026-05-30"],
        }),
        "session_milestone",
      ).eligible,
    ).toBe(true);
  });

  it("respects cooldown after a previous prompt", () => {
    const result = evaluateAppReviewEligibility(
      baseState({
        completedCheckouts: 10,
        lastPromptAt: "2026-05-01T00:00:00.000Z",
      }),
      "checkout_success",
    );
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("cooldown");
  });
});
