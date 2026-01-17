import type { SupabaseClient } from "../../db/supabase.client";
import type { MasteryDistributionDto, DueCardsDto, TotalCardsDto, LearningStatsResponseDto } from "../../types";

/**
 * Service responsible for retrieving learning statistics
 * All metrics calculated from flashcards table using SM-2 columns
 */
export class LearningStatsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get comprehensive learning statistics for the authenticated user
   *
   * @returns Combined learning metrics
   */
  async getStats(): Promise<LearningStatsResponseDto> {
    const mastery = await this.getMasteryDistribution();
    const schedule = await this.getDueCards();
    const totals = await this.getTotalCardsStats();

    return {
      mastery,
      schedule,
      totals,
    };
  }

  /**
   * Calculate mastery distribution based on sm2_repetition
   *
   * Mastery levels:
   * - New: repetition = 0 (never reviewed)
   * - Learning: repetition 1-2 (in learning phase)
   * - Mastered: repetition >= 3 (well known)
   */
  private async getMasteryDistribution(): Promise<MasteryDistributionDto> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error("User not authenticated");
    }

    const userId = data.user.id;

    // Fetch all flashcards with repetition counts
    const { data: flashcards, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("sm2_repetition")
      .eq("user_id", userId);

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch flashcards for mastery distribution:", fetchError);
      throw new Error("Failed to calculate mastery distribution");
    }

    const cards = flashcards || [];
    const totalCards = cards.length;

    // Count cards by mastery level
    const newCards = cards.filter((c) => c.sm2_repetition === 0).length;
    const learningCards = cards.filter((c) => c.sm2_repetition >= 1 && c.sm2_repetition <= 2).length;
    const masteredCards = cards.filter((c) => c.sm2_repetition >= 3).length;

    return {
      newCards,
      learningCards,
      masteredCards,
      totalCards,
    };
  }

  /**
   * Calculate due cards based on next_review_at timestamps
   */
  private async getDueCards(): Promise<DueCardsDto> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error("User not authenticated");
    }

    const userId = data.user.id;

    // Calculate date boundaries
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const endOfNextWeek = new Date(now);
    endOfNextWeek.setDate(endOfNextWeek.getDate() + 14);
    endOfNextWeek.setHours(23, 59, 59, 999);

    // Fetch all flashcards with next_review_at
    const { data: flashcards, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("next_review_at")
      .eq("user_id", userId);

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch flashcards for due cards:", fetchError);
      throw new Error("Failed to calculate due cards");
    }

    const cards = flashcards || [];

    // Count cards by due date ranges
    const dueNow = cards.filter((c) => {
      const reviewDate = new Date(c.next_review_at);
      return reviewDate <= now;
    }).length;

    const dueTomorrow = cards.filter((c) => {
      const reviewDate = new Date(c.next_review_at);
      return reviewDate > now && reviewDate <= tomorrow;
    }).length;

    const dueThisWeek = cards.filter((c) => {
      const reviewDate = new Date(c.next_review_at);
      return reviewDate > now && reviewDate <= endOfWeek;
    }).length;

    const dueNextWeek = cards.filter((c) => {
      const reviewDate = new Date(c.next_review_at);
      return reviewDate > now && reviewDate <= endOfNextWeek;
    }).length;

    return {
      dueNow,
      dueTomorrow,
      dueThisWeek,
      dueNextWeek,
    };
  }

  /**
   * Calculate total cards statistics and quality metrics
   */
  private async getTotalCardsStats(): Promise<TotalCardsDto> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error("User not authenticated");
    }

    const userId = data.user.id;

    // Fetch all flashcards with necessary fields
    const { data: flashcards, error: fetchError } = await this.supabase
      .from("flashcards")
      .select("sm2_repetition, sm2_efactor, updated_at")
      .eq("user_id", userId);

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch flashcards for total stats:", fetchError);
      throw new Error("Failed to calculate total stats");
    }

    const cards = flashcards || [];
    const totalCards = cards.length;

    // Count reviewed cards
    const reviewedAtLeastOnce = cards.filter((c) => c.sm2_repetition > 0).length;
    const neverReviewedYet = totalCards - reviewedAtLeastOnce;

    // Calculate average ease factor (only for reviewed cards)
    const reviewedCards = cards.filter((c) => c.sm2_repetition > 0);
    const avgEaseFactor =
      reviewedCards.length > 0 ? reviewedCards.reduce((sum, c) => sum + c.sm2_efactor, 0) / reviewedCards.length : 2.5;

    // Find last review date (most recent updated_at for reviewed cards)
    const lastReviewDate =
      reviewedCards.length > 0
        ? reviewedCards
            .map((c) => new Date(c.updated_at).getTime())
            .reduce((latest, current) => Math.max(latest, current), 0)
        : null;

    return {
      totalCards,
      reviewedAtLeastOnce,
      neverReviewedYet,
      avgEaseFactor: Math.round(avgEaseFactor * 100) / 100, // Round to 2 decimals
      lastReviewDate: lastReviewDate ? new Date(lastReviewDate).toISOString() : null,
    };
  }
}
