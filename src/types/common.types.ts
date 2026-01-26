/*
 * Common Types
 *
 * Shared enums, literals, and common DTOs used across the application.
 */

// -----------------------------------------------------------------------------
// ENUMS & LITERALS
// -----------------------------------------------------------------------------

/**
 * Origin of a flashcard recorded in the database.
 */
export type FlashcardSourceType = "ai-full" | "ai-edited" | "manual";

export type FlashcardSortOption = "created_at" | "updated_at";
export type GenerationSourceSortOption = "created_at";
export type SortOrder = "asc" | "desc";

// -----------------------------------------------------------------------------
// ERROR ENVELOPE
// -----------------------------------------------------------------------------

export interface ErrorResponseDto {
  error: {
    message: string;
    fields?: Record<string, string>;
  };
}
