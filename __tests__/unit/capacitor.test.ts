import { describe, expect, it, afterEach } from "vitest";
import {
  isCapacitorNative,
  getCapacitorPlatform,
  NATIVE_USER_AGENT_MARKER,
} from "@/lib/utils/capacitor";

describe("capacitor detection", () => {
  afterEach(() => {
    document.documentElement.classList.remove("native-app");
    delete document.documentElement.dataset.capacitorPlatform;
  });

  it("returns web when Capacitor is absent", () => {
    expect(isCapacitorNative()).toBe(false);
    expect(getCapacitorPlatform()).toBe("web");
  });

  it("detects native shell from user agent marker", () => {
    const original = navigator.userAgent;
    Object.defineProperty(navigator, "userAgent", {
      value: `${original} ${NATIVE_USER_AGENT_MARKER}1.0`,
      configurable: true,
    });
    expect(isCapacitorNative()).toBe(true);
    Object.defineProperty(navigator, "userAgent", {
      value: original,
      configurable: true,
    });
  });
});
