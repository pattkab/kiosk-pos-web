import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Kiosk POS/i);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Get Started/i }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
});

test('redirects to login when accessing dashboard unauthenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
