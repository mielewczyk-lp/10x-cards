import supermemo, { type SuperMemoItem, type SuperMemoGrade } from "supermemo";
import type { SupabaseClient } from "../../db/supabase.client";
import type { ReviewSessionFlashcardDto, StartReviewSessionResponseDto, SubmitAnswerResponseDto } from "../../types";

/**
 * Error thrown when no flashcards are available for review
 */
export class NoFlashcardsAvailableError extends Error {
  public nextReviewDate: string | null;

  constructor(nextReviewDate: string | null = null) {
    super("No flashcards available for review");
    this.name = "NoFlashcardsAvailableError";
    this.nextReviewDate = nextReviewDate;
  }
}

/**
 * Error thrown when a flashcard is not found
 */
export class ReviewFlashcardNotFoundError extends Error {
  constructor(id: string) {
    super(`Flashcard with id ${id} not found or not due for review`);
    this.name = "ReviewFlashcardNotFoundError";
  }
}

/**
 * Error thrown when a flashcard doesn't belong to the user
 */
export class ReviewFlashcardForbiddenError extends Error {
  constructor(id: string) {
    super(`Flashcard with id ${id} does not belong to the user`);
    this.name = "ReviewFlashcardForbiddenError";
  }
}

/**
 * Service responsible for managing review sessions and spaced repetition
 */
export class ReviewSessionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get flashcards that are due for review
   *
   * @param userId - ID of the user
   * @param limit - Maximum number of flashcards to return (default 20, max 50)
   * @returns Array of flashcards with their SM-2 state
   * @throws NoFlashcardsAvailableError if no flashcards are due for review
   */
  async getFlashcardsForReview(userId: string, limit = 20): Promise<StartReviewSessionResponseDto> {
    // Clamp limit to max 50
    const effectiveLimit = Math.min(limit, 50);

    // Fetch flashcards that are due for review (next_review_at <= NOW())
    const {
      data: flashcards,
      error,
      count,
    } = await this.supabase
      .from("flashcards")
      .select("id, front, back, sm2_interval, sm2_repetition, sm2_efactor", { count: "exact" })
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(effectiveLimit);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch flashcards for review:", error);
      throw new Error("Failed to fetch flashcards for review");
    }

    if (!flashcards || flashcards.length === 0) {
      // No flashcards ready for review - fetch next review date
      const { data: nextFlashcard } = await this.supabase
        .from("flashcards")
        .select("next_review_at")
        .eq("user_id", userId)
        .gt("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      throw new NoFlashcardsAvailableError(nextFlashcard?.next_review_at || null);
    }

    // Map to DTOs with SM-2 state
    const flashcardDtos: ReviewSessionFlashcardDto[] = flashcards.map((flashcard) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      sm2State: {
        interval: flashcard.sm2_interval,
        repetition: flashcard.sm2_repetition,
        efactor: flashcard.sm2_efactor,
      },
    }));

    return {
      flashcards: flashcardDtos,
      total: count ?? flashcards.length,
    };
  }

  /**
   * Submit answer for a flashcard and update its SM-2 state
   *
   * @param userId - ID of the user
   * @param flashcardId - ID of the flashcard being reviewed
   * @param grade - SM-2 grade (0-5)
   * @returns Next review date and optional next flashcard
   * @throws ReviewFlashcardNotFoundError if flashcard doesn't exist or not due for review
   * @throws ReviewFlashcardForbiddenError if flashcard doesn't belong to user
   */
  async submitAnswer(userId: string, flashcardId: string, grade: SuperMemoGrade): Promise<SubmitAnswerResponseDto> {
    // Step 1: Fetch current flashcard with SM-2 state
    const { data: flashcard, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("id, user_id, sm2_interval, sm2_repetition, sm2_efactor")
      .eq("id", flashcardId)
      .maybeSingle();

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch flashcard ${flashcardId}:`, fetchError);
      throw new Error("Failed to fetch flashcard");
    }

    if (!flashcard) {
      throw new ReviewFlashcardNotFoundError(flashcardId);
    }

    if (flashcard.user_id !== userId) {
      throw new ReviewFlashcardForbiddenError(flashcardId);
    }

    // Step 2: Calculate new SM-2 state using supermemo library
    const currentItem: SuperMemoItem = {
      interval: flashcard.sm2_interval,
      repetition: flashcard.sm2_repetition,
      efactor: flashcard.sm2_efactor,
    };

    const newState = supermemo(currentItem, grade);

    // Step 3: Calculate next review date
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + newState.interval);

    // Step 4: Update flashcard in database
    const { error: updateError } = await this.supabase
      .from("flashcards")
      .update({
        sm2_interval: newState.interval,
        sm2_repetition: newState.repetition,
        sm2_efactor: newState.efactor,
        next_review_at: nextReviewAt.toISOString(),
      })
      .eq("id", flashcardId)
      .eq("user_id", userId);

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error(`Failed to update flashcard ${flashcardId}:`, updateError);
      throw new Error("Failed to update flashcard");
    }

    // Step 5: Check if there are more flashcards available
    const { data: nextFlashcards, error: nextError } = await this.supabase
      .from("flashcards")
      .select("id, front, back, sm2_interval, sm2_repetition, sm2_efactor")
      .eq("user_id", userId)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true })
      .limit(1);

    if (nextError) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch next flashcard:", nextError);
    }

    const hasMore = nextFlashcards && nextFlashcards.length > 0;
    const nextFlashcard = hasMore
      ? {
          id: nextFlashcards[0].id,
          front: nextFlashcards[0].front,
          back: nextFlashcards[0].back,
          sm2State: {
            interval: nextFlashcards[0].sm2_interval,
            repetition: nextFlashcards[0].sm2_repetition,
            efactor: nextFlashcards[0].sm2_efactor,
          },
        }
      : null;

    return {
      nextReviewAt: nextReviewAt.toISOString(),
      hasMore,
      nextFlashcard,
    };
  }
}
