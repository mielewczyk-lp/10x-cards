import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole("button", { name: /sign in|log in/i });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async isVisible() {
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });
    return true;
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    // Wait for form to be fully loaded and interactive
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // CRITICAL: Wait for React to be hydrated before interacting
    // This prevents race conditions when tests run in parallel
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(100);

    // Fill email with type simulation (slower but more reliable)
    await this.emailInput.click();
    await this.emailInput.clear();
    await this.emailInput.pressSequentially(email, { delay: 50 });

    // Wait and verify email is still there
    await this.page.waitForTimeout(200);
    let emailValue = await this.emailInput.inputValue();
    if (emailValue !== email) {
      throw new Error(`Email field lost value. Expected: "${email}", Got: "${emailValue}"`);
    }

    // Fill password
    await this.passwordInput.click();
    await this.passwordInput.clear();
    await this.passwordInput.pressSequentially(password, { delay: 50 });

    // Final verification before submit
    await this.page.waitForTimeout(200);
    emailValue = await this.emailInput.inputValue();
    const passwordValue = await this.passwordInput.inputValue();

    if (!emailValue || !passwordValue) {
      throw new Error(
        `Fields not filled correctly before submit. ` +
          `Email: "${emailValue}", Password length: ${passwordValue.length}`
      );
    }

    await this.submitButton.click();
  }

  async waitForNavigation(expectedUrl: RegExp, timeout = 10000) {
    await this.page.waitForURL(expectedUrl, { timeout });
  }
}
