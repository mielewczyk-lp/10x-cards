import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Flashcard List page (/flashcards)
 *
 * Features:
 * - Table display with flashcard rows
 * - Edit and delete actions
 * - Verification methods for list state
 */
export class FlashcardListPage {
  readonly page: Page;
  private readonly flashcardTable: Locator;
  private readonly flashcardTableBody: Locator;
  private readonly emptyState: Locator;
  private readonly loadingState: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use role selector which works before React hydration
    this.flashcardTable = page.getByRole("table");
    this.flashcardTableBody = page.getByTestId("flashcard-table-body");
    this.emptyState = page.getByText("No flashcards found.");
    this.loadingState = page.getByText("Loading flashcards...");
  }

  async goto() {
    await this.page.goto("/flashcards");
  }

  /**
   * Wait for page to load and data to be rendered
   */
  async isVisible() {
    // Wait for page load and React hydration
    await this.page.waitForLoadState("networkidle");
    
    // Give time for React to render and API to respond
    await this.page.waitForTimeout(1000);
    
    return true;
  }

  /**
   * Wait for table to be visible (use when you know flashcards exist)
   */
  async waitForTable() {
    await this.flashcardTable.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Get flashcard row by index (0-based)
   */
  getFlashcardRow(index: number): Locator {
    return this.page.getByTestId(`flashcard-row-${index}`);
  }

  /**
   * Get front text for a flashcard by index
   */
  getFlashcardFront(index: number): Locator {
    return this.page.getByTestId(`flashcard-front-${index}`);
  }

  /**
   * Get back text for a flashcard by index
   */
  getFlashcardBack(index: number): Locator {
    return this.page.getByTestId(`flashcard-back-${index}`);
  }

  /**
   * Get edit button for a flashcard by index
   */
  getEditButton(index: number): Locator {
    return this.page.getByTestId(`flashcard-edit-button-${index}`);
  }

  /**
   * Get delete button for a flashcard by index
   */
  getDeleteButton(index: number): Locator {
    return this.page.getByTestId(`flashcard-delete-button-${index}`);
  }

  /**
   * Count total number of flashcards in the list
   */
  async countFlashcards(): Promise<number> {
    // Wait for table body to be visible
    try {
      await this.flashcardTableBody.waitFor({ state: "visible", timeout: 3000 });
    } catch {
      return 0; // No flashcards
    }
    
    // Count table rows using tbody > tr selector
    const rowCount = await this.flashcardTableBody.locator('tr').count();
    return rowCount;
  }

  /**
   * Get front text content for a flashcard by index
   */
  async getFrontText(index: number): Promise<string> {
    const front = this.getFlashcardFront(index);
    await front.waitFor({ state: "visible" });
    return (await front.textContent()) || "";
  }

  /**
   * Get back text content for a flashcard by index
   */
  async getBackText(index: number): Promise<string> {
    const back = this.getFlashcardBack(index);
    await back.waitFor({ state: "visible" });
    return (await back.textContent()) || "";
  }

  /**
   * Click edit button for a flashcard by index
   */
  async clickEdit(index: number): Promise<void> {
    const editButton = this.getEditButton(index);
    await editButton.waitFor({ state: "visible" });
    await editButton.click();
  }

  /**
   * Click delete button for a flashcard by index
   */
  async clickDelete(index: number): Promise<void> {
    const deleteButton = this.getDeleteButton(index);
    await deleteButton.waitFor({ state: "visible" });
    await deleteButton.click();
  }

  /**
   * Verify flashcard exists at specific index
   */
  async flashcardExists(index: number): Promise<boolean> {
    try {
      await this.getFlashcardRow(index).waitFor({ state: "visible", timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
