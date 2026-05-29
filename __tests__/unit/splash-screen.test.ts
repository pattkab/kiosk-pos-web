import { describe, expect, it } from "vitest";
import {
  isAppShellRoute,
  isAuthRoute,
  signalNativeAppReady,
} from "@/lib/native/splash-screen";

describe("splash-screen route helpers", () => {
  it("detects app shell routes", () => {
    expect(isAppShellRoute("/dashboard")).toBe(true);
    expect(isAppShellRoute("/pos")).toBe(true);
    expect(isAppShellRoute("/settings/device")).toBe(true);
    expect(isAppShellRoute("/")).toBe(false);
  });

  it("detects auth routes", () => {
    expect(isAuthRoute("/login")).toBe(true);
    expect(isAuthRoute("/register")).toBe(true);
    expect(isAuthRoute("/dashboard")).toBe(false);
  });

  it("signals app ready only once", () => {
    const events: string[] = [];
    window.__kioskposAppReady = undefined;
    window.addEventListener("kioskpos:app-ready", () => events.push("ready"));

    signalNativeAppReady();
    signalNativeAppReady();

    expect(events).toHaveLength(1);
    expect(window.__kioskposAppReady).toBe(true);
  });
});
