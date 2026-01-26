import type { Page } from "@playwright/test";

/**
 * Helper for creating flashcards via API
 * This is faster than using the UI and useful for test setup
 */
export class FlashcardApiHelper {
  constructor(private page: Page) {}

  /**
   * Create a single flashcard via API
   * Must be called when user is authenticated
   */
  async createFlashcard(front: string, back: string): Promise<{ id: string; front: string; back: string }> {
    // API expects an array of flashcards
    const response = await this.page.request.post("/api/flashcards", {
      data: [
        {
          front,
          back,
          sourceType: "manual",
          generationSourceId: null,
        },
      ],
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`Failed to create flashcard via API: ${response.status()} - ${errorBody}`);
    }

    // API returns array, get first item
    const created = await response.json();
    return created[0];
  }

  /**
   * Create multiple flashcards via API
   * Returns array of created flashcard IDs
   */
  async createFlashcardBatch(
    flashcards: { front: string; back: string }[]
  ): Promise<{ id: string; front: string; back: string }[]> {
    // API expects array of flashcards
    const response = await this.page.request.post("/api/flashcards", {
      data: flashcards.map((fc) => ({
        front: fc.front,
        back: fc.back,
        sourceType: "manual",
        generationSourceId: null,
      })),
    });

    if (!response.ok()) {
      const errorBody = await response.text();
      throw new Error(`Failed to create flashcards via API: ${response.status()} - ${errorBody}`);
    }

    return await response.json();
  }

  /**
   * Create flashcards that are immediately ready for review
   * Waits a moment to ensure next_review_at is in the past relative to query time
   */
  async createFlashcardsForReview(
    flashcards: { front: string; back: string }[]
  ): Promise<{ id: string; front: string; back: string }[]> {
    const created = await this.createFlashcardBatch(flashcards);

    // Wait to ensure the flashcards' next_review_at (set to NOW() on creation)
    // is definitely in the past when the review session queries for flashcards
    // Increased timeout to handle potential clock skew and DB latency
    await this.page.waitForTimeout(2000);

    return created;
  }

  /**
   * Delete a flashcard via API
   */
  async deleteFlashcard(id: string): Promise<void> {
    const response = await this.page.request.delete(`/api/flashcards/${id}`);

    if (!response.ok()) {
      throw new Error(`Failed to delete flashcard via API: ${response.status()}`);
    }
  }

  /**
   * Delete all flashcards created in a batch
   */
  async deleteFlashcardBatch(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.deleteFlashcard(id);
    }
  }

  /**
   * Get all flashcards for the current user
   */
  async getAllFlashcards(): Promise<{ id: string }[]> {
    const response = await this.page.request.get("/api/flashcards?pageSize=100");

    if (!response.ok()) {
      throw new Error(`Failed to get flashcards via API: ${response.status()}`);
    }

    const data = await response.json();
    return data.items || [];
  }

  /**
   * Delete all flashcards for the current user (cleanup)
   */
  async deleteAllFlashcards(): Promise<void> {
    const flashcards = await this.getAllFlashcards();
    const ids = flashcards.map((fc: { id: string }) => fc.id);

    if (ids.length > 0) {
      await this.deleteFlashcardBatch(ids);
    }
  }
}
