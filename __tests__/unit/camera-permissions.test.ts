import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  ensureCameraPermission,
  formatScannerStartError,
} from "@/lib/native/camera-permissions";

vi.mock("@/lib/utils/capacitor", () => ({
  isCapacitorNative: vi.fn(() => false),
}));

describe("camera-permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(global.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
      },
    });
  });

  it("returns unavailable when getUserMedia is missing", async () => {
    Object.defineProperty(global.navigator, "mediaDevices", {
      configurable: true,
      value: undefined,
    });

    const result = await ensureCameraPermission();
    expect(result.granted).toBe(false);
    expect(result.message).toContain("not supported");
  });

  it("allows web scanning when camera is not explicitly denied", async () => {
    Object.defineProperty(global.navigator, "permissions", {
      configurable: true,
      value: {
        query: vi.fn().mockResolvedValue({ state: "prompt" }),
      },
    });

    const result = await ensureCameraPermission();
    expect(result.granted).toBe(true);
  });

  it("maps permission errors to a helpful message", () => {
    expect(
      formatScannerStartError(new Error("Permission denied by system")),
    ).toContain("Camera access was denied");
  });

  it("maps missing camera errors", () => {
    expect(formatScannerStartError(new Error("Requested device not found"))).toContain(
      "No camera was found",
    );
  });
});
