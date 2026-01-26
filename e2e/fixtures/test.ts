/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { LoginPage } from "../pages/LoginPage";

// Extend base test with custom fixtures
interface CustomFixtures {
  makeAxeBuilder: () => AxeBuilder;
  authenticatedPage: Promise<void>;
}

export const test = base.extend<CustomFixtures>({
  makeAxeBuilder: async ({ page }, use) => {
    const createAxeBuilder = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
    await use(createAxeBuilder);
  },

  // Playwright fixture function - "use" is not a React hook
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test file for authenticated tests");
    }

    // Navigate to login page
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Perform login
    await loginPage.login(email, password);

    // Wait for successful navigation (to /create or dashboard)
    await loginPage.waitForNavigation(/\/(create|dashboard|$)/, 15000);

    // Use the authenticated page
    await use();
  },
});

export { expect } from "@playwright/test";
