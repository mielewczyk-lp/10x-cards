/*
 * Generation Source Types
 *
 * Command models and DTOs for AI-generated flashcard sources.
 */

import type { GenerationSourceSortOption, SortOrder } from "./common.types";

// -----------------------------------------------------------------------------
// COMMAND MODELS
// -----------------------------------------------------------------------------

/**
 * Command → POST /generation-sources
 */
export interface CreateGenerationSourceCommand {
  /** AI input text (1000–10000 characters). */
  inputText: string;
}

/**
 * Command → PATCH /generation-sources/{id}
 */
export interface UpdateGenerationSourceCommand {
  totalAccepted?: number;
  totalAcceptedEdited?: number;
  totalRejected?: number;
}

// -----------------------------------------------------------------------------
// DTOS
// -----------------------------------------------------------------------------

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
