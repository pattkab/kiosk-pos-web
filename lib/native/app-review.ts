import { getCapacitorPlatform, isCapacitorNative } from "@/lib/utils/capacitor";
import {
  getNativeStoreReviewUrl,
  getPlayStoreMarketUrl,
  NATIVE_APP_STORE,
} from "@/lib/native/app-store";

const STORAGE_KEY = "kioskpos.app-review.v1";
export const APP_REVIEW_CHECK_EVENT = "kioskpos:check-app-review";

export type AppReviewTrigger = "checkout_success" | "session_milestone" | "manual";

export interface AppReviewState {
  firstSeenAt: string;
  completedCheckouts: number;
  sessionDays: string[];
  lastPromptAt: string | null;
  ratedAt: string | null;
  neverAskAgain: boolean;
}

export interface AppReviewEligibility {
  eligible: boolean;
  reason?: string;
}

const MIN_CHECKOUTS = 5;
const MIN_SESSION_DAYS = 3;
const MIN_DAYS_SINCE_INSTALL = 2;
const PROMPT_COOLDOWN_DAYS = 90;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, to = new Date()) {
  const from = new Date(fromIso).getTime();
  const toMs = to.getTime();
  return Math.floor((toMs - from) / (1000 * 60 * 60 * 24));
}

function readState(): AppReviewState {
  if (typeof window === "undefined") {
    return {
      firstSeenAt: new Date().toISOString(),
      completedCheckouts: 0,
      sessionDays: [],
      lastPromptAt: null,
      ratedAt: null,
      neverAskAgain: false,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialState();
    }
    const parsed = JSON.parse(raw) as Partial<AppReviewState>;
    return {
      ...createInitialState(),
      ...parsed,
      sessionDays: Array.isArray(parsed.sessionDays) ? parsed.sessionDays : [],
    };
  } catch {
    return createInitialState();
  }
}

function createInitialState(): AppReviewState {
  return {
    firstSeenAt: new Date().toISOString(),
    completedCheckouts: 0,
    sessionDays: [],
    lastPromptAt: null,
    ratedAt: null,
    neverAskAgain: false,
  };
}

function writeState(state: AppReviewState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAppReviewState(): AppReviewState {
  return readState();
}

export function recordNativeAppSessionDay() {
  if (!isCapacitorNative()) return readState();

  const state = readState();
  const day = todayKey();
  if (!state.sessionDays.includes(day)) {
    state.sessionDays = [...state.sessionDays, day].slice(-30);
    writeState(state);
  }
  return state;
}

export function recordSuccessfulCheckout(): AppReviewState {
  if (typeof window === "undefined") return createInitialState();

  const state = readState();
  state.completedCheckouts += 1;
  writeState(state);
  return state;
}

export function evaluateAppReviewEligibility(
  state: AppReviewState,
  trigger: AppReviewTrigger,
  now = new Date(),
): AppReviewEligibility {
  if (state.neverAskAgain) {
    return { eligible: false, reason: "user_declined_or_rated" };
  }

  if (trigger !== "manual" && state.ratedAt) {
    return { eligible: false, reason: "user_declined_or_rated" };
  }

  if (trigger === "manual") {
    return { eligible: true };
  }

  if (daysBetween(state.firstSeenAt, now) < MIN_DAYS_SINCE_INSTALL) {
    return { eligible: false, reason: "too_soon_after_install" };
  }

  if (state.lastPromptAt && daysBetween(state.lastPromptAt, now) < PROMPT_COOLDOWN_DAYS) {
    return { eligible: false, reason: "cooldown" };
  }

  if (trigger === "checkout_success" && state.completedCheckouts >= MIN_CHECKOUTS) {
    return { eligible: true };
  }

  if (trigger === "session_milestone" && state.sessionDays.length >= MIN_SESSION_DAYS) {
    return { eligible: true };
  }

  return { eligible: false, reason: "milestones_not_met" };
}

export function markAppReviewPromptShown() {
  const state = readState();
  state.lastPromptAt = new Date().toISOString();
  writeState(state);
}

export function markAppReviewRated() {
  const state = readState();
  state.ratedAt = new Date().toISOString();
  state.lastPromptAt = state.ratedAt;
  writeState(state);
}

export function markAppReviewDismissed(options?: { neverAskAgain?: boolean }) {
  const state = readState();
  state.lastPromptAt = new Date().toISOString();
  if (options?.neverAskAgain) {
    state.neverAskAgain = true;
  }
  writeState(state);
}

export function requestAppReviewCheck(trigger: AppReviewTrigger) {
  if (typeof window === "undefined" || !isCapacitorNative()) return;
  window.dispatchEvent(
    new CustomEvent(APP_REVIEW_CHECK_EVENT, { detail: { trigger } }),
  );
}

export async function openNativeStoreListing() {
  const platform = getCapacitorPlatform();
  if (platform === "web" || typeof window === "undefined") return false;

  const primaryUrl = getNativeStoreReviewUrl(platform);
  const fallbackUrl =
    platform === "android"
      ? getPlayStoreMarketUrl(NATIVE_APP_STORE.androidPackageId)
      : primaryUrl;

  const opened = window.open(primaryUrl, "_blank", "noopener,noreferrer");
  if (opened) return true;

  window.open(fallbackUrl, "_blank", "noopener,noreferrer");
  return true;
}

/** Native in-app review sheet (Play In-App Review / StoreKit). Falls back to store listing. */
export async function requestNativeInAppReview() {
  if (!isCapacitorNative()) return false;

  try {
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    markAppReviewRated();
    return true;
  } catch {
    await openNativeStoreListing();
    markAppReviewRated();
    return false;
  }
}
