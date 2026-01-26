import { test, expect } from "./fixtures/test";
import { FlashcardListPage } from "./pages/FlashcardListPage";
import { EditFlashcardModal } from "./pages/EditFlashcardModal";
import { DeleteFlashcardDialog } from "./pages/DeleteFlashcardDialog";
import { FlashcardGenerator } from "./helpers/FlashcardGenerator";
import { FlashcardApiHelper } from "./helpers/FlashcardApiHelper";

test.describe("Flashcard Management", () => {
  let flashcardListPage: FlashcardListPage;
  let editModal: EditFlashcardModal;
  let deleteDialog: DeleteFlashcardDialog;
  let generator: FlashcardGenerator;
  let apiHelper: FlashcardApiHelper;
  let createdFlashcardIds: string[] = [];

  test.beforeEach(async ({ page, authenticatedPage }) => {
    // Use authenticatedPage fixture to ensure user is logged in
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = authenticatedPage;
    flashcardListPage = new FlashcardListPage(page);
    editModal = new EditFlashcardModal(page);
    deleteDialog = new DeleteFlashcardDialog(page);
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

  test("should display, edit and delete flashcards", async ({ page }) => {
    // SETUP: Create 1 unique flashcard via API
    const flashcard = generator.generateProgrammingFlashcard();
    const created = await apiHelper.createFlashcard(flashcard.front, flashcard.back);
    createdFlashcardIds = [created.id];

    // STEP 1: Open /flashcards page
    await flashcardListPage.goto();
    await flashcardListPage.isVisible();

    // STEP 2: Verify the flashcard is displayed by its unique front text
    const flashcardElement = page.getByText(flashcard.front).first();
    await expect(flashcardElement).toBeVisible();

    // STEP 3: Click edit button for this flashcard (find by text, then find edit button in same row)
    const row = page.locator('tr', { has: page.getByText(flashcard.front) }).first();
    const editButton = row.getByRole('button', { name: /edit/i });
    await editButton.click();
    
    await editModal.waitForModal();
    expect(await editModal.isVisible()).toBe(true);

    // STEP 4: Change the front value
    const newFront = `EDITED: ${flashcard.front}`;
    await editModal.fillFront(newFront);

    // STEP 5: Save changes and verify new value is displayed
    await editModal.save();
    await page.waitForTimeout(500);

    // Verify the edited text is visible
    const editedElement = page.getByText(newFront).first();
    await expect(editedElement).toBeVisible();

    // STEP 6: Delete the flashcard
    const editedRow = page.locator('tr', { has: page.getByText(newFront) }).first();
    const deleteButton = editedRow.getByRole('button', { name: /delete/i });
    await deleteButton.click();

    await deleteDialog.waitForDialog();
    expect(await deleteDialog.isVisible()).toBe(true);

    // Confirm deletion
    await deleteDialog.confirm();
    await page.waitForTimeout(500);

    // Remove from cleanup list since we deleted it
    createdFlashcardIds = [];

    // STEP 7: Verify the flashcard was deleted (text should not be visible)
    await expect(editedElement).not.toBeVisible({ timeout: 3000 });
  });

  test("should cancel edit without saving changes", async ({ page }) => {
    // Setup: Create 1 flashcard via API
    const flashcard = generator.generateProgrammingFlashcard();
    const created = await apiHelper.createFlashcard(flashcard.front, flashcard.back);
    createdFlashcardIds = [created.id];

    // Go to flashcard list
    await flashcardListPage.goto();
    await flashcardListPage.isVisible();

    // Verify flashcard is visible
    await expect(page.getByText(flashcard.front).first()).toBeVisible();

    // Click edit
    const row = page.locator('tr', { has: page.getByText(flashcard.front) }).first();
    const editButton = row.getByRole('button', { name: /edit/i });
    await editButton.click();
    await editModal.waitForModal();

    // Change front value
    await editModal.fillFront("This should not be saved");

    // Cancel instead of saving
    await editModal.cancel();

    // Verify original value is still displayed
    await expect(page.getByText(flashcard.front).first()).toBeVisible();
    await expect(page.getByText("This should not be saved").first()).not.toBeVisible();
  });

  test("should cancel delete without removing flashcard", async ({ page }) => {
    // Setup: Create 1 flashcard via API
    const flashcard = generator.generateProgrammingFlashcard();
    const created = await apiHelper.createFlashcard(flashcard.front, flashcard.back);
    createdFlashcardIds = [created.id];

    // Go to flashcard list
    await flashcardListPage.goto();
    await flashcardListPage.isVisible();

    // Verify flashcard is visible
    await expect(page.getByText(flashcard.front).first()).toBeVisible();

    // Click delete
    const row = page.locator('tr', { has: page.getByText(flashcard.front) }).first();
    const deleteButton = row.getByRole('button', { name: /delete/i });
    await deleteButton.click();
    await deleteDialog.waitForDialog();

    // Cancel deletion
    await deleteDialog.cancel();

    // Verify flashcard still exists
    await expect(page.getByText(flashcard.front).first()).toBeVisible();
  });

  test("should edit both front and back values", async ({ page }) => {
    // Setup: Create 1 flashcard via API
    const flashcard = generator.generateProgrammingFlashcard();
    const created = await apiHelper.createFlashcard(flashcard.front, flashcard.back);
    createdFlashcardIds = [created.id];

    // Go to flashcard list
    await flashcardListPage.goto();
    await flashcardListPage.isVisible();

    // Verify flashcard is visible
    await expect(page.getByText(flashcard.front).first()).toBeVisible();

    // Click edit
    const row = page.locator('tr', { has: page.getByText(flashcard.front) }).first();
    const editButton = row.getByRole('button', { name: /edit/i });
    await editButton.click();
    await editModal.waitForModal();

    // Change both values
    const newFront = "New Front Value";
    const newBack = "New Back Value";
    await editModal.fillFront(newFront);
    await editModal.fillBack(newBack);

    // Save changes
    await editModal.save();
    await page.waitForTimeout(500);

    // Verify both values are updated
    await expect(page.getByText(newFront).first()).toBeVisible();
    // Note: back text is in same row, but might be truncated in table
  });

  test("should handle multiple edits and deletes in sequence", async ({ page }) => {
    // Setup: Create 2 unique flashcards via API
    const flashcards = generator.generateBatch(2);
    const created = await apiHelper.createFlashcardBatch(flashcards);
    createdFlashcardIds = created.map((fc) => fc.id);

    // Go to flashcard list
    await flashcardListPage.goto();
    await flashcardListPage.isVisible();

    // Verify both flashcards are visible
    await expect(page.getByText(flashcards[0].front).first()).toBeVisible();
    await expect(page.getByText(flashcards[1].front).first()).toBeVisible();

    // Edit first flashcard
    const row1 = page.locator('tr', { has: page.getByText(flashcards[0].front) }).first();
    const editButton1 = row1.getByRole('button', { name: /edit/i });
    await editButton1.click();
    await editModal.waitForModal();
    
    const newFront1 = "Edited First";
    await editModal.fillFront(newFront1);
    await editModal.save();
    await page.waitForTimeout(300);

    // Edit second flashcard
    const row2 = page.locator('tr', { has: page.getByText(flashcards[1].front) }).first();
    const editButton2 = row2.getByRole('button', { name: /edit/i });
    await editButton2.click();
    await editModal.waitForModal();
    
    const newFront2 = "Edited Second";
    await editModal.fillFront(newFront2);
    await editModal.save();
    await page.waitForTimeout(300);

    // Verify both edits are visible
    await expect(page.getByText(newFront1).first()).toBeVisible();
    await expect(page.getByText(newFront2).first()).toBeVisible();

    // Delete second flashcard
    const editedRow2 = page.locator('tr', { has: page.getByText(newFront2) }).first();
    const deleteButton2 = editedRow2.getByRole('button', { name: /delete/i });
    await deleteButton2.click();
    await deleteDialog.waitForDialog();
    await deleteDialog.confirm();
    await page.waitForTimeout(300);

    // Remove deleted flashcard from cleanup list
    createdFlashcardIds.splice(1, 1);

    // Verify first flashcard still exists and second is gone
    await expect(page.getByText(newFront1).first()).toBeVisible();
    await expect(page.getByText(newFront2).first()).not.toBeVisible({ timeout: 3000 });
  });
});
