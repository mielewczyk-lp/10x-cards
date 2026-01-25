import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Delete Flashcard Dialog
 *
 * Features:
 * - Preview of flashcard to be deleted
 * - Confirm and cancel actions
 * - Error handling
 */
export class DeleteFlashcardDialog {
  readonly page: Page;
  private readonly dialog: Locator;
  private readonly flashcardPreview: Locator;
  private readonly confirmButton: Locator;
  private readonly cancelButton: Locator;
  private readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use heading + role to find dialog - works before React hydration
    this.dialog = page.getByRole("dialog").filter({ has: page.getByRole("heading", { name: /delete flashcard/i }) });
    this.flashcardPreview = page.getByTestId("delete-flashcard-preview");
    this.confirmButton = page.getByRole("button", { name: /^delete$/i });
    this.cancelButton = page.getByRole("button", { name: /cancel/i }).first();
    this.errorAlert = page.getByTestId("delete-flashcard-error");
  }

  async isVisible(): Promise<boolean> {
    await this.dialog.waitFor({ state: "visible" });
    return true;
  }

  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Get preview text of flashcard to be deleted
   */
  async getPreviewText(): Promise<string> {
    await this.flashcardPreview.waitFor({ state: "visible" });
    return (await this.flashcardPreview.textContent()) || "";
  }

  /**
   * Confirm deletion and wait for API response
   */
  async confirm(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/flashcards/") && response.request().method() === "DELETE"
    );

    await this.confirmButton.waitFor({ state: "visible" });
    await this.confirmButton.click();

    const response = await responsePromise;
    if (!response.ok()) {
      throw new Error(`Failed to delete flashcard: ${response.status()}`);
    }

    // Wait for dialog to close
    await this.dialog.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {
      // Dialog might still be visible if there was an error
    });
  }

  /**
   * Cancel deletion
   */
  async cancel(): Promise<void> {
    await this.cancelButton.waitFor({ state: "visible" });
    await this.cancelButton.click();

    // Wait for dialog to close
    await this.dialog.waitFor({ state: "hidden", timeout: 2000 });
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
}
