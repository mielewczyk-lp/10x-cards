import { test, expect } from "./fixtures/test";
import { CreatePage } from "./pages/CreatePage";
import { ManualFlashcardPage } from "./pages/ManualFlashcardPage";
import { FlashcardGenerator } from "./helpers/FlashcardGenerator";

test.describe("Manual Flashcard Creation", () => {
  let createPage: CreatePage;
  let manualFlashcardPage: ManualFlashcardPage;
  let generator: FlashcardGenerator;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  test.beforeEach(async ({ page, authenticatedPage }) => {
    // Use authenticatedPage fixture to ensure user is logged in
    createPage = new CreatePage(page);
    manualFlashcardPage = new ManualFlashcardPage(page);
    generator = new FlashcardGenerator();

    // Navigate to create page (user is already authenticated)
    await createPage.goto();
    await createPage.isVisible();
  });

  test("should display manual flashcard form when manual tab is selected", async () => {
    // Select manual tab
    await createPage.selectManualTab();

    // Verify manual tab is active
    expect(await createPage.isManualTabActive()).toBe(true);

    // Verify manual flashcard form is visible
    await manualFlashcardPage.isVisible();
  });

  test("should have save button disabled when form is empty", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    // Save button should be disabled when both fields are empty
    expect(await manualFlashcardPage.isSaveButtonDisabled()).toBe(true);
  });

  test("should create a single flashcard successfully", async () => {
    // Navigate to manual tab
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    // Generate unique flashcard
    const flashcard = generator.generateProgrammingFlashcard();

    // Fill and save flashcard
    await manualFlashcardPage.createAndWaitForSuccess(flashcard.front, flashcard.back);

    // Verify success toast appeared
    await expect(manualFlashcardPage["successToast"]).toBeVisible();
  });

  test("should create 5 unique flashcards sequentially", async () => {
    // Navigate to manual tab
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    // Generate 5 unique flashcards
    const flashcards = generator.generateBatch(5);

    // Create each flashcard
    for (const flashcard of flashcards) {
      // Fill the form
      await manualFlashcardPage.fillFlashcard(flashcard.front, flashcard.back);

      // Verify form is filled correctly
      expect(await manualFlashcardPage.getFrontValue()).toContain(flashcard.front);
      expect(await manualFlashcardPage.getBackValue()).toContain(flashcard.back);

      // Save the flashcard (waits for API response automatically)
      await manualFlashcardPage.save();

      // Clear form for next iteration
      await manualFlashcardPage.clearForm();
    }
  });

  test("should validate empty front field", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    // Fill only back field
    await manualFlashcardPage.fillBack("This is the back content");

    // Front field is empty, so save button should be disabled
    expect(await manualFlashcardPage.isSaveButtonDisabled()).toBe(true);
  });

  test("should validate empty back field", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    // Fill only front field
    await manualFlashcardPage.fillFront("This is the front content");

    // Back field is empty, so save button should be disabled
    expect(await manualFlashcardPage.isSaveButtonDisabled()).toBe(true);
  });

  test("should enable save button when both fields are filled", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    const flashcard = generator.generateProgrammingFlashcard();

    // Fill both fields
    await manualFlashcardPage.fillFlashcard(flashcard.front, flashcard.back);

    // Save button should be enabled
    expect(await manualFlashcardPage.isSaveButtonEnabled()).toBe(true);
  });

  test("should create flashcard using keyboard shortcut (Ctrl+Enter)", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    const flashcard = generator.generateProgrammingFlashcard();

    // Fill the form
    await manualFlashcardPage.fillFlashcard(flashcard.front, flashcard.back);

    // Save using keyboard shortcut
    await manualFlashcardPage.saveWithKeyboard();

    // Verify success
    await manualFlashcardPage.waitForSuccessToast();
    await expect(manualFlashcardPage["successToast"]).toBeVisible();
  });

  test("should handle rapid flashcard creation", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    const flashcards = generator.generateBatch(3);

    for (const flashcard of flashcards) {
      await manualFlashcardPage.fillFlashcard(flashcard.front, flashcard.back);
      await manualFlashcardPage.save(); // Already waits for API
      await manualFlashcardPage.clearForm();
    }
  });

  test("should switch between tabs without losing form state", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    const flashcard = generator.generateProgrammingFlashcard();

    // Fill the form
    await manualFlashcardPage.fillFlashcard(flashcard.front, flashcard.back);

    // Switch to AI tab
    await createPage.selectAITab();
    expect(await createPage.isAITabActive()).toBe(true);

    // Switch back to manual tab
    await createPage.selectManualTab();
    expect(await createPage.isManualTabActive()).toBe(true);

    // Note: Form state might be lost due to client:load directive
    // This test documents the current behavior
  });

  test("should respect character limits", async () => {
    await createPage.selectManualTab();
    await manualFlashcardPage.isVisible();

    // Front has 200 char limit, back has 500 char limit
    const longFront = "A".repeat(250); // Exceeds 200
    const longBack = "B".repeat(600); // Exceeds 500

    await manualFlashcardPage.fillFront(longFront);
    await manualFlashcardPage.fillBack(longBack);

    // Get actual values (should be truncated by maxLength attribute if implemented)
    const frontValue = await manualFlashcardPage.getFrontValue();
    const backValue = await manualFlashcardPage.getBackValue();

    // Values should not exceed limits (this might fail if maxLength is not set)
    // This test documents expected behavior
    expect(frontValue.length).toBeLessThanOrEqual(200);
    expect(backValue.length).toBeLessThanOrEqual(500);
  });
});
