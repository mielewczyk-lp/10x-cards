import type { Page, Locator } from "@playwright/test";

/**
 * Page Object Model for Review page (/review)
 *
 * Features:
 * - Review session with flashcard display
 * - Show Answer functionality
 * - Answer buttons (Again/Hard/Good/Easy)
 * - Progress tracking
 */
export class ReviewPage {
  readonly page: Page;
  private readonly reviewCard: Locator;
  private readonly reviewCardTitle: Locator;
  private readonly reviewCardContent: Locator;
  private readonly showAnswerButton: Locator;
  private readonly answerButtons: Locator;
  private readonly answerButtonAgain: Locator;
  private readonly answerButtonHard: Locator;
  private readonly answerButtonGood: Locator;
  private readonly answerButtonEasy: Locator;

  constructor(page: Page) {
    this.page = page;
    this.reviewCard = page.getByTestId("review-card");
    this.reviewCardTitle = page.getByTestId("review-card-title");
    this.reviewCardContent = page.getByTestId("review-card-content");
    this.showAnswerButton = page.getByTestId("show-answer-button");
    this.answerButtons = page.getByTestId("answer-buttons");
    this.answerButtonAgain = page.getByTestId("answer-button-again");
    this.answerButtonHard = page.getByTestId("answer-button-hard");
    this.answerButtonGood = page.getByTestId("answer-button-good");
    this.answerButtonEasy = page.getByTestId("answer-button-easy");
  }

  async goto() {
    await this.page.goto("/review");
  }

  /**
   * Wait for review page to load and session to start
   */
  async waitForSession() {
    await this.page.waitForLoadState("networkidle");
    
    // Wait for API call to review-sessions to complete
    try {
      await this.page.waitForResponse(
        (response) => response.url().includes("/api/review-sessions") && response.request().method() === "POST",
        { timeout: 5000 }
      );
    } catch {
      // API might have already completed before we started waiting
    }
    
    // Give React more time to render the response
    await this.page.waitForTimeout(2000);
  }

  /**
   * Check if review card is visible
   */
  async isReviewCardVisible(): Promise<boolean> {
    try {
      await this.reviewCard.waitFor({ state: "visible", timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the card title (Question or Answer)
   */
  async getCardTitle(): Promise<string> {
    await this.reviewCardTitle.waitFor({ state: "visible" });
    return (await this.reviewCardTitle.textContent()) || "";
  }

  /**
   * Get the flashcard content (front or back text)
   */
  async getCardContent(): Promise<string> {
    await this.reviewCardContent.waitFor({ state: "visible" });
    return (await this.reviewCardContent.textContent()) || "";
  }

  /**
   * Check if Show Answer button is visible
   */
  async isShowAnswerButtonVisible(): Promise<boolean> {
    try {
      await this.showAnswerButton.waitFor({ state: "visible", timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click Show Answer button
   */
  async clickShowAnswer(): Promise<void> {
    await this.showAnswerButton.waitFor({ state: "visible" });
    await this.showAnswerButton.click();
    // Wait for answer to appear
    await this.page.waitForTimeout(300);
  }

  /**
   * Check if answer buttons are visible
   */
  async areAnswerButtonsVisible(): Promise<boolean> {
    try {
      await this.answerButtons.waitFor({ state: "visible", timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if all answer buttons (Again/Hard/Good/Easy) are visible
   */
  async areAllAnswerButtonsVisible(): Promise<boolean> {
    try {
      await this.answerButtonAgain.waitFor({ state: "visible", timeout: 1000 });
      await this.answerButtonHard.waitFor({ state: "visible", timeout: 1000 });
      await this.answerButtonGood.waitFor({ state: "visible", timeout: 1000 });
      await this.answerButtonEasy.waitFor({ state: "visible", timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Click Again button
   */
  async clickAgain(): Promise<void> {
    await this.answerButtonAgain.waitFor({ state: "visible" });
    await this.answerButtonAgain.click();
  }

  /**
   * Click Hard button
   */
  async clickHard(): Promise<void> {
    await this.answerButtonHard.waitFor({ state: "visible" });
    await this.answerButtonHard.click();
  }

  /**
   * Click Good button
   */
  async clickGood(): Promise<void> {
    await this.answerButtonGood.waitFor({ state: "visible" });
    await this.answerButtonGood.click();
  }

  /**
   * Click Easy button
   */
  async clickEasy(): Promise<void> {
    await this.answerButtonEasy.waitFor({ state: "visible" });
    await this.answerButtonEasy.click();
  }
}
