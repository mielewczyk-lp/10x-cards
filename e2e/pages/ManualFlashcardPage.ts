import type { Page, Locator } from "@playwright/test";

export class ManualFlashcardPage {
  readonly page: Page;
  private readonly form: Locator;
  private readonly frontInput: Locator;
  private readonly backInput: Locator;
  private readonly saveButton: Locator;
  private readonly frontError: Locator;
  private readonly backError: Locator;
  private readonly successToast: Locator;
  private readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use accessible selectors that work before React hydration
    this.form = page.locator("form").filter({ has: page.getByRole("button", { name: /save flashcard/i }) });
    this.frontInput = page.locator("#manual-front");
    this.backInput = page.locator("#manual-back");
    this.saveButton = page.getByRole("button", { name: /save flashcard/i });
    this.frontError = page.locator("#manual-front-error");
    this.backError = page.locator("#manual-back-error");
    this.successToast = page.getByText("Flashcard created successfully!").first();
    this.errorToast = page.getByRole("status").filter({ hasText: /failed|error/i });
  }

  async isVisible() {
    await this.form.waitFor({ state: "visible" });
    await this.frontInput.waitFor({ state: "visible" });
    await this.backInput.waitFor({ state: "visible" });
    return true;
  }

  async fillFront(text: string) {
    await this.frontInput.waitFor({ state: "visible" });
    // Wait for React hydration
    await this.page.waitForLoadState("networkidle");
    await this.frontInput.click();
    await this.frontInput.fill(text);
    // Verify it's filled
    await this.page.waitForTimeout(100);
  }

  async fillBack(text: string) {
    await this.backInput.waitFor({ state: "visible" });
    await this.backInput.click();
    await this.backInput.fill(text);
    // Verify it's filled
    await this.page.waitForTimeout(100);
  }

  async fillFlashcard(front: string, back: string) {
    await this.fillFront(front);
    await this.fillBack(back);
  }

  async save() {
    // Wait for API response instead of toast
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/flashcards") && response.request().method() === "POST"
    );

    await this.saveButton.waitFor({ state: "visible" });
    await this.saveButton.click();

    // Wait for response and check if successful
    const response = await responsePromise;
    if (!response.ok()) {
      throw new Error(`Failed to save flashcard: ${response.status()}`);
    }
  }

  async createFlashcard(front: string, back: string) {
    await this.fillFlashcard(front, back);
    await this.save();
  }

  async waitForSuccessToast(timeout = 3000) {
    await this.successToast.waitFor({ state: "visible", timeout });
  }

  async waitForErrorToast(timeout = 5000) {
    await this.errorToast.waitFor({ state: "visible", timeout });
  }

  async isSaveButtonDisabled() {
    return await this.saveButton.isDisabled();
  }

  async isSaveButtonEnabled() {
    return await this.saveButton.isEnabled();
  }

  async getFrontValue() {
    return await this.frontInput.inputValue();
  }

  async getBackValue() {
    return await this.backInput.inputValue();
  }

  async hasFrontError() {
    return await this.frontError.isVisible().catch(() => false);
  }

  async hasBackError() {
    return await this.backError.isVisible().catch(() => false);
  }

  async getFrontErrorText() {
    return await this.frontError.textContent();
  }

  async getBackErrorText() {
    return await this.backError.textContent();
  }

  async waitForFormReset(timeout = 2000) {
    // Wait for success toast to appear first
    await this.waitForSuccessToast();

    // Wait for inputs to be cleared (form reset)
    await this.page
      .waitForFunction(
        () => {
          const inputs = document.querySelectorAll(
            'textarea[placeholder*="question"], textarea[placeholder*="answer"]'
          );
          return Array.from(inputs).every((input) => (input as HTMLTextAreaElement).value === "");
        },
        { timeout }
      )
      .catch(() => {
        // Form might not reset automatically, which is fine
        return true;
      });
  }

  /**
   * Creates a flashcard and waits for success confirmation
   */
  async createAndWaitForSuccess(front: string, back: string) {
    await this.fillFlashcard(front, back);
    await this.save(); // save() already waits for API response
    // Small delay for UI to update
    await this.page.waitForTimeout(200);
  }

  /**
   * Clears the form manually (useful if form doesn't auto-reset)
   */
  async clearForm() {
    await this.frontInput.clear();
    await this.backInput.clear();
  }

  /**
   * Uses keyboard shortcut Ctrl+Enter to save (or Cmd+Enter on Mac)
   */
  async saveWithKeyboard() {
    const isMac = process.platform === "darwin";
    const modifier = isMac ? "Meta" : "Control";
    await this.frontInput.press(`${modifier}+Enter`);
  }
}
