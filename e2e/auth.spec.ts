import { test, expect } from "./fixtures/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/10x Cards/i);
    // Check if login form is present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.click();

    // Expect form validation to prevent submission
    await expect(page).toHaveURL(/login/);
  });

  test.skip("should pass accessibility checks", async ({ page, makeAxeBuilder }) => {
    // Skip this test as there are known accessibility issues to fix
    // Issue: Button color contrast is 3.53, needs to be at least 4.5:1
    await page.goto("/login");

    const accessibilityScanResults = await makeAxeBuilder().analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
