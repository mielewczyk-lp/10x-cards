/*
 * DTO (Data Transfer Object) and Command Model Types
 *
 * This file centralises all DTOs and Command Models required by the REST API.
 * Types are derived from database entities declared in `src/db/database.types.ts`
 * so that the public contract stays in sync with the underlying schema.
 */

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// -----------------------------------------------------------------------------
// ENTITY ALIASES – make base entities easier to reference later on
// -----------------------------------------------------------------------------

export type FlashcardEntity = Tables<"flashcards">;
export type FlashcardInsert = TablesInsert<"flashcards">;
export type FlashcardUpdate = TablesUpdate<"flashcards">;

export type GenerationSourceEntity = Tables<"generation_sources">;
export type GenerationSourceInsert = TablesInsert<"generation_sources">;
export type GenerationSourceUpdate = TablesUpdate<"generation_sources">;

// -----------------------------------------------------------------------------
// ENUMS & COMMON LITERALS
// -----------------------------------------------------------------------------

/**
 * Origin of a flashcard recorded in the database.
 */
export type FlashcardSourceType = "ai-full" | "ai-edited" | "manual";

export type FlashcardSortOption = "created_at" | "updated_at";
export type GenerationSourceSortOption = "created_at";
export type SortOrder = "asc" | "desc";

// -----------------------------------------------------------------------------
// GENERATION SOURCE – COMMAND MODELS & DTOS
// -----------------------------------------------------------------------------

/**
 * Command → POST /generation-sources
 */
export interface CreateGenerationSourceCommand {
  /** AI input text (1000–10000 characters). */
  inputText: string;
}

/**
 * A single flashcard candidate returned from the AI engine
 */
export interface FlashcardCandidateDto {
  front: string;
  back: string;
}

/**
 * 201 Response → POST /generation-sources
 */
export interface CreateGenerationSourceResponseDto {
  id: string;
  createdAt: string;
  candidates: FlashcardCandidateDto[];
}

/**
 * DTO for GET /generation-sources/{id}
 * Exposes metadata & stats – **no candidates**.
 */
export interface GenerationSourceDto {
  id: string;
  inputText: string;
  modelName: string | null;
  totalGenerated: number;
  totalAccepted: number;
  totalAcceptedEdited: number;
  totalRejected: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Command → PATCH /generation-sources/{id}
 */
export interface UpdateGenerationSourceCommand {
  totalAccepted?: number;
  totalAcceptedEdited?: number;
  totalRejected?: number;
}

/**
 * Item used in paginated list → GET /generation-sources
 */
export type GenerationSourceListItemDto = Omit<GenerationSourceDto, "inputText">;

export interface ListGenerationSourcesQuery {
  page?: number;
  pageSize?: number;
  sort?: GenerationSourceSortOption;
  order?: SortOrder;
}

export interface PaginatedGenerationSourcesDto {
  items: GenerationSourceListItemDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * DTO for error log item
 */
export interface ErrorLogDto {
  id: string;
  errorMessage: string;
  createdAt: string;
}

/**
 * Response for listing error logs (all errors in one array)
 */
export interface ErrorLogsResponseDto {
  errors: ErrorLogDto[];
}

// -----------------------------------------------------------------------------
// FLASHCARD – COMMAND MODELS & DTOS
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

// -----------------------------------------------------------------------------
// KPI STATS
// -----------------------------------------------------------------------------

/**
 * DTO for AI acceptance rate statistics
 */
export interface AIAcceptanceRateDto {
  totalGenerated: number;
  totalAccepted: number;
  totalAcceptedEdited: number;
  totalRejected: number;
  acceptanceRate: number;
}

/**
 * DTO for AI flashcard share statistics
 */
export interface AIFlashcardShareDto {
  totalFlashcards: number;
  aiFlashcards: number;
  manualFlashcards: number;
  aiSharePercentage: number;
}

/**
 * DTO for GET /api/stats - combined KPI metrics
 */
export interface StatsResponseDto {
  aiAcceptanceRate: AIAcceptanceRateDto;
  aiFlashcardShare: AIFlashcardShareDto;
}

// -----------------------------------------------------------------------------
// REVIEW SESSION – COMMAND MODELS & DTOS
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
 * Command → POST /review-sessions
 */
export interface StartReviewSessionCommand {
  /** Maximum number of flashcards to return (default 20, max 50) */
  limit?: number;
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
 * Command → PATCH /review-sessions/flashcards/{id}/answer
 */
export interface SubmitAnswerCommand {
  /** SM-2 grade (0-5) */
  grade: number;
}

/**
 * Response → PATCH /review-sessions/flashcards/{id}/answer
 */
export interface SubmitAnswerResponseDto {
  nextReviewAt: string;
  hasMore: boolean;
  nextFlashcard: ReviewSessionFlashcardDto | null;
}

// -----------------------------------------------------------------------------
// ERROR ENVELOPE
// -----------------------------------------------------------------------------

export interface ErrorResponseDto {
  error: {
    message: string;
    fields?: Record<string, string>;
  };
}
