import { test, expect } from "@playwright/test";

test.describe("offline PWA shell", () => {
  test("exposes web app manifest", async ({ page }) => {
    await page.goto("/");
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", /manifest/);
  });

  test("loads offline fallback page", async ({ page }) => {
    const response = await page.goto("/offline.html");
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(/offline/i);
  });

  test("registers service worker in production build", async ({
    page,
    baseURL,
  }) => {
    test.skip(
      Boolean(!process.env.CI && baseURL?.includes("localhost:3000")),
      "Service worker is disabled in default dev mode; run against production build in CI.",
    );

    await page.goto("/");
    const registered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const registration = await navigator.serviceWorker.getRegistration();
      return Boolean(registration);
    });
    expect(registered).toBe(true);
  });
});
