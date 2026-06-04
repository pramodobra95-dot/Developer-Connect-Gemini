import { test, expect } from '@playwright/test';

test.describe('Login Error Handling', () => {
  test('should show error message instead of crashing on invalid login', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Ensure the landing page is loaded
    await expect(page.locator('text=Hire developers in India')).toBeVisible();

    const emailInput = page.locator('input[placeholder="name@company.com"]');
    await emailInput.fill('nonexistent@example.com');

    await page.click('button:has-text("Authenticate Now")');

    // It should show an error message
    const errorToast = page.locator('.bg-rose-50, .text-rose-700').first();
    await expect(errorToast).toBeVisible();
    const errorText = await errorToast.innerText();

    // Ensure it's not the generic timeout error we removed
    expect(errorText).not.toContain("Network connection timed out. Production database unavailable.");

    // It should be a specific error from the server
    expect(errorText.length).toBeGreaterThan(5);
  });
});
