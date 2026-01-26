/*
 * Flashcard Types
 *
 * Command models and DTOs for flashcards and practice mode.
 */

import type { FlashcardSourceType, FlashcardSortOption, SortOrder } from "./common.types";

// -----------------------------------------------------------------------------
// COMMAND MODELS
// -----------------------------------------------------------------------------

/**
 * Command → POST /flashcards
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
  sourceType: FlashcardSourceType;
  generationSourceId?: string | null;
}

/**
 * Command → PATCH /flashcards/{id}
 */
export interface UpdateFlashcardCommand {
  front?: string;
  back?: string;
}

/**
 * Command → POST /flashcards/practice
 */
export interface StartPracticeCommand {
  /** Number of flashcards to fetch (10, 20, or 50) */
  limit: number;
}

// -----------------------------------------------------------------------------
// DTOS
// -----------------------------------------------------------------------------

/**
 * DTO returned by GET /flashcards/{id} and 201 response of POST /flashcards
 */
export interface FlashcardDto {
  id: string;
  front: string;
  back: string;
  sourceType: FlashcardSourceType;
  generationSourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListFlashcardsQuery {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: FlashcardSortOption;
  order?: SortOrder;
}

export interface PaginatedFlashcardsDto {
  items: FlashcardDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Simple flashcard DTO for practice mode (without SM-2 state)
 */
export interface PracticeFlashcardDto {
  id: string;
  front: string;
  back: string;
}

/**
 * Response → POST /flashcards/practice
 */
export interface StartPracticeResponseDto {
  flashcards: PracticeFlashcardDto[];
  total: number;
}
