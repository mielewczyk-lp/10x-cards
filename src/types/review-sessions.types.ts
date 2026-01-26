/*
 * Review Session Types
 *
 * Command models and DTOs for spaced repetition review sessions using SM-2 algorithm.
 */

// -----------------------------------------------------------------------------
// COMMAND MODELS
// -----------------------------------------------------------------------------

/**
 * Command → POST /review-sessions
 */
export interface StartReviewSessionCommand {
  /** Maximum number of flashcards to return (default 20, max 50) */
  limit?: number;
}

/**
 * Command → PATCH /review-sessions/flashcards/{id}/answer
 */
export interface SubmitAnswerCommand {
  /** SM-2 grade (0-5) */
  grade: number;
}

// -----------------------------------------------------------------------------
// DTOS
// -----------------------------------------------------------------------------

/**
 * SM-2 algorithm state for a flashcard
 */
export interface SM2State {
  interval: number;
  repetition: number;
  efactor: number;
}

/**
 * Flashcard DTO with SM-2 state for review session
 */
export interface ReviewSessionFlashcardDto {
  id: string;
  front: string;
  back: string;
  sm2State: SM2State;
}

/**
 * Response → POST /review-sessions
 */
export interface StartReviewSessionResponseDto {
  flashcards: ReviewSessionFlashcardDto[];
  total: number;
  nextReviewDate?: string | null;
}

/**
 * Response → PATCH /review-sessions/flashcards/{id}/answer
 */
export interface SubmitAnswerResponseDto {
  nextReviewAt: string;
  hasMore: boolean;
  nextFlashcard: ReviewSessionFlashcardDto | null;
}
