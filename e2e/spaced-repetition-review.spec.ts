import { test, expect } from "./fixtures/test";
import { ReviewPage } from "./pages/ReviewPage";
import { FlashcardGenerator } from "./helpers/FlashcardGenerator";
import { FlashcardApiHelper } from "./helpers/FlashcardApiHelper";

test.describe("Spaced Repetition Review Session", () => {
  let reviewPage: ReviewPage;
  let generator: FlashcardGenerator;
  let apiHelper: FlashcardApiHelper;
  let createdFlashcardIds: string[] = [];

  test.beforeEach(async ({ page, authenticatedPage }) => {
    // Use authenticatedPage fixture to ensure user is logged in
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = authenticatedPage;
    reviewPage = new ReviewPage(page);
    generator = new FlashcardGenerator();
    apiHelper = new FlashcardApiHelper(page);
    createdFlashcardIds = [];
  });

  test.afterEach(async () => {
    // Cleanup: delete all flashcards created in this test
    if (createdFlashcardIds.length > 0) {
      await apiHelper.deleteFlashcardBatch(createdFlashcardIds);
    }
  });

  test("should display flashcard question, show answer, and display review buttons", async ({ page }) => {
    // SETUP: Create 2 unique flashcards via API that are ready for review
    const flashcards = generator.generateBatch(2);
    const created = await apiHelper.createFlashcardsForReview(flashcards);
    createdFlashcardIds = created.map((fc) => fc.id);

    // STEP 1: Open /review page
    await reviewPage.goto();
    await reviewPage.waitForSession();

    // STEP 2: Verify the front of flashcard (question) is displayed
    const isCardVisible = await reviewPage.isReviewCardVisible();
    expect(isCardVisible).toBe(true);

    // Verify the title shows "Question"
    const cardTitle = await reviewPage.getCardTitle();
    expect(cardTitle).toBe("Question");

    // Verify that some content is displayed (could be any flashcard from any test)
    const cardContent = await reviewPage.getCardContent();
    expect(cardContent.length).toBeGreaterThan(0);

    // STEP 3: Verify Show Answer button is visible
    const isShowAnswerVisible = await reviewPage.isShowAnswerButtonVisible();
    expect(isShowAnswerVisible).toBe(true);

    // STEP 4: Click Show Answer
    await reviewPage.clickShowAnswer();

    // STEP 5: Verify the back of flashcard (answer) is displayed
    await page.waitForTimeout(300);
    const updatedTitle = await reviewPage.getCardTitle();
    expect(updatedTitle).toBe("Answer");

    // Verify that answer content is displayed
    const answerContent = await reviewPage.getCardContent();
    expect(answerContent.length).toBeGreaterThan(0);

    // STEP 6: Verify review buttons (Again/Hard/Good/Easy) are displayed
    const areAnswerButtonsVisible = await reviewPage.areAnswerButtonsVisible();
    expect(areAnswerButtonsVisible).toBe(true);

    // Verify all 4 buttons are visible
    const areAllButtonsVisible = await reviewPage.areAllAnswerButtonsVisible();
    expect(areAllButtonsVisible).toBe(true);
  });

  test("should navigate to next question after rating flashcard", async ({ page }) => {
    // SETUP: Create 2 unique flashcards via API that are ready for review
    const flashcards = generator.generateBatch(2);
    const created = await apiHelper.createFlashcardsForReview(flashcards);
    createdFlashcardIds = created.map((fc) => fc.id);

    // STEP 1: Open /review page and see first question
    await reviewPage.goto();
    await reviewPage.waitForSession();

    const isCardVisible = await reviewPage.isReviewCardVisible();
    expect(isCardVisible).toBe(true);

    const firstQuestionContent = await reviewPage.getCardContent();
    expect(firstQuestionContent.length).toBeGreaterThan(0);

    // STEP 2: Show answer
    await reviewPage.clickShowAnswer();
    await page.waitForTimeout(300);

    const cardTitle = await reviewPage.getCardTitle();
    expect(cardTitle).toBe("Answer");

    // STEP 3: Click "Good" button
    await reviewPage.clickGood();

    // Wait for the transition to next card
    await page.waitForTimeout(1500);

    // STEP 4: Verify we're redirected to next question
    const secondQuestionTitle = await reviewPage.getCardTitle();
    expect(secondQuestionTitle).toBe("Question");

    const secondQuestionContent = await reviewPage.getCardContent();
    expect(secondQuestionContent.length).toBeGreaterThan(0);
  });
});
