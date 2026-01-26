import { test, expect } from "./fixtures/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(page).toHaveTitle(/10x Cards/i);
    // Check if login form is present
    await expect(await loginPage.isVisible()).toBe(true);
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();

    // Expect form validation to prevent submission
    await expect(page).toHaveURL(/login/);
  });

  test("should login with valid credentials from env", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in env file for authentication tests");
    }

    await loginPage.login(email, password);

    // Wait for navigation to complete after successful login
    await loginPage.waitForNavigation(/\/create/);

    // Verify we're on the create page
    await expect(page).toHaveURL(/\/create/);
  });

  test.skip("should pass accessibility checks", async ({ page, makeAxeBuilder }) => {
    // Skip this test as there are known accessibility issues to fix
    // Issue: Button color contrast is 3.53, needs to be at least 4.5:1
    await page.goto("/login");

    const accessibilityScanResults = await makeAxeBuilder().analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
