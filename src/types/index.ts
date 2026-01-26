/*
 * Type System Index
 *
 * Central re-export point for all application types.
 * This file maintains backward compatibility with existing imports from "@/types".
 */

// Entity aliases
export type {
  FlashcardEntity,
  FlashcardInsert,
  FlashcardUpdate,
  GenerationSourceEntity,
  GenerationSourceInsert,
  GenerationSourceUpdate,
} from "./entities";

// Common types
export type {
  FlashcardSourceType,
  FlashcardSortOption,
  GenerationSourceSortOption,
  SortOrder,
  ErrorResponseDto,
} from "./common.types";

// Generation sources
export type {
  CreateGenerationSourceCommand,
  UpdateGenerationSourceCommand,
  FlashcardCandidateDto,
  CreateGenerationSourceResponseDto,
  GenerationSourceDto,
  GenerationSourceListItemDto,
  ListGenerationSourcesQuery,
  PaginatedGenerationSourcesDto,
  ErrorLogDto,
  ErrorLogsResponseDto,
} from "./generation-sources.types";

// Flashcards
export type {
  CreateFlashcardCommand,
  UpdateFlashcardCommand,
  StartPracticeCommand,
  FlashcardDto,
  ListFlashcardsQuery,
  PaginatedFlashcardsDto,
  PracticeFlashcardDto,
  StartPracticeResponseDto,
} from "./flashcards.types";

// Stats
export type {
  AIAcceptanceRateDto,
  AIFlashcardShareDto,
  StatsResponseDto,
  MasteryDistributionDto,
  DueCardsDto,
  TotalCardsDto,
  LearningStatsResponseDto,
} from "./stats.types";

// Review sessions
export type {
  StartReviewSessionCommand,
  SubmitAnswerCommand,
  SM2State,
  ReviewSessionFlashcardDto,
  StartReviewSessionResponseDto,
  SubmitAnswerResponseDto,
} from "./review-sessions.types";
