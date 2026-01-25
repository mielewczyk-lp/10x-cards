import type { Page, Locator } from "@playwright/test";

export class CreatePage {
  readonly page: Page;
  private readonly aiTab: Locator;
  private readonly manualTab: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use role and accessible name - these work immediately
    this.aiTab = page.getByRole("link", { name: /ai generation/i });
    this.manualTab = page.getByRole("link", { name: /manual entry/i });
  }

  async goto() {
    await this.page.goto("/create");
  }

  async isVisible() {
    await this.aiTab.waitFor({ state: "visible" });
    await this.manualTab.waitFor({ state: "visible" });
    return true;
  }

  async selectManualTab() {
    await this.manualTab.click();
    await this.page.waitForURL(/tab=manual/);
  }

  async selectAITab() {
    await this.aiTab.click();
    await this.page.waitForURL(/tab=ai/);
  }

  async isManualTabActive() {
    const url = this.page.url();
    return url.includes("tab=manual");
  }

  async isAITabActive() {
    const url = this.page.url();
    return url.includes("tab=ai");
  }
}
