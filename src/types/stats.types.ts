/*
 * Statistics Types
 *
 * DTOs for KPI statistics and learning progress tracking.
 */

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
// LEARNING STATS
// -----------------------------------------------------------------------------

/**
 * Distribution of flashcards by mastery level
 * Based on sm2_repetition count
 */
export interface MasteryDistributionDto {
  /** Cards never reviewed (repetition = 0) */
  newCards: number;
  /** Cards in learning phase (repetition 1-2) */
  learningCards: number;
  /** Mastered cards (repetition >= 3) */
  masteredCards: number;
  /** Total flashcards */
  totalCards: number;
}

/**
 * Schedule of upcoming reviews
 * Based on next_review_at timestamps
 */
export interface DueCardsDto {
  /** Cards due now (next_review_at <= NOW) */
  dueNow: number;
  /** Cards due tomorrow */
  dueTomorrow: number;
  /** Cards due within next 7 days */
  dueThisWeek: number;
  /** Cards due within next 14 days */
  dueNextWeek: number;
}

/**
 * Overall statistics about flashcard collection
 */
export interface TotalCardsDto {
  /** Total number of flashcards */
  totalCards: number;
  /** Cards reviewed at least once (repetition > 0) */
  reviewedAtLeastOnce: number;
  /** Cards never reviewed yet (repetition = 0) */
  neverReviewedYet: number;
  /** Average ease factor across all cards */
  avgEaseFactor: number;
  /** Timestamp of last review (most recent updated_at where repetition > 0) */
  lastReviewDate: string | null;
}

/**
 * Response for GET /api/stats/learning
 * Combined learning statistics
 */
export interface LearningStatsResponseDto {
  mastery: MasteryDistributionDto;
  schedule: DueCardsDto;
  totals: TotalCardsDto;
}
