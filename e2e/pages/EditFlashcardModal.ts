import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Edit Flashcard Modal
 *
 * Features:
 * - Edit front and back fields
 * - Save and cancel actions
 * - Error handling
 */
export class EditFlashcardModal {
  readonly page: Page;
  private readonly modal: Locator;
  private readonly form: Locator;
  private readonly frontInput: Locator;
  private readonly backInput: Locator;
  private readonly saveButton: Locator;
  private readonly cancelButton: Locator;
  private readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use heading + role to find modal - works before React hydration
    this.modal = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: "Edit Flashcard" }) });
    this.form = page.getByTestId("edit-flashcard-form");
    this.frontInput = page.locator("#edit-front");
    this.backInput = page.locator("#edit-back");
    this.saveButton = page.getByRole("button", { name: /save changes/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i }).first();
    this.errorAlert = page.getByTestId("edit-flashcard-error");
  }

  async isVisible(): Promise<boolean> {
    await this.modal.waitFor({ state: "visible" });
    return true;
  }

  async waitForModal(): Promise<void> {
    await this.modal.waitFor({ state: "visible", timeout: 5000 });
    // Wait for inputs to be ready
    await this.frontInput.waitFor({ state: "visible" });
    await this.backInput.waitFor({ state: "visible" });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get current front input value
   */
  async getFrontValue(): Promise<string> {
    return await this.frontInput.inputValue();
  }

  /**
   * Get current back input value
   */
  async getBackValue(): Promise<string> {
    return await this.backInput.inputValue();
  }

  /**
   * Clear and fill front input
   */
  async fillFront(text: string): Promise<void> {
    await this.frontInput.waitFor({ state: "visible" });
    await this.frontInput.click();
    await this.frontInput.clear();
    await this.frontInput.fill(text);
    await this.page.waitForTimeout(100); // Wait for React state update
  }

  /**
   * Clear and fill back input
   */
  async fillBack(text: string): Promise<void> {
    await this.backInput.waitFor({ state: "visible" });
    await this.backInput.click();
    await this.backInput.clear();
    await this.backInput.fill(text);
    await this.page.waitForTimeout(100); // Wait for React state update
  }

  /**
   * Save changes and wait for API response
   */
  async save(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/flashcards/") && response.request().method() === "PATCH"
    );

    await this.saveButton.waitFor({ state: "visible" });
    await this.saveButton.click();

    const response = await responsePromise;
    if (!response.ok()) {
      throw new Error(`Failed to save flashcard: ${response.status()}`);
    }

    // Wait for modal to close
    await this.modal.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {
      // Modal might still be visible if there was an error
    });
  }

  /**
   * Cancel editing
   */
  async cancel(): Promise<void> {
    await this.cancelButton.waitFor({ state: "visible" });
    await this.cancelButton.click();

    // Wait for modal to close
    await this.modal.waitFor({ state: "hidden", timeout: 2000 });
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    try {
      await this.errorAlert.waitFor({ state: "visible", timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    await this.errorAlert.waitFor({ state: "visible" });
    return (await this.errorAlert.textContent()) || "";
  }

  /**
   * Edit flashcard with new values
   */
  async editFlashcard(newFront: string, newBack: string): Promise<void> {
    await this.fillFront(newFront);
    await this.fillBack(newBack);
    await this.save();
  }
}
