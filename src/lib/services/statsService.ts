import type { SupabaseClient } from "../../db/supabase.client";
import type { AIAcceptanceRateDto, AIFlashcardShareDto, StatsResponseDto } from "../../types";

/**
 * Service responsible for retrieving KPI statistics
 */
export class StatsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get KPI statistics for the authenticated user
   *
   * Note: User filtering is enforced by SQL functions using auth.uid()
   * No need to pass userId - it's automatically filtered by RLS
   *
   * @returns Combined KPI metrics for current user
   */
  async getStats(): Promise<StatsResponseDto> {
    // Fetch AI acceptance rate (filtered by auth.uid() in SQL)
    const acceptanceRate = await this.getAIAcceptanceRate();

    // Fetch AI flashcard share (filtered by auth.uid() in SQL)
    const flashcardShare = await this.getAIFlashcardShare();

    return {
      aiAcceptanceRate: acceptanceRate,
      aiFlashcardShare: flashcardShare,
    };
  }

  /**
   * Calculate AI acceptance rate from generation_sources table
   * Automatically filtered to current user via auth.uid()
   */
  private async getAIAcceptanceRate(): Promise<AIAcceptanceRateDto> {
    const { data, error } = await this.supabase.rpc("calculate_ai_acceptance_rate", {
      p_start_date: null,
      p_end_date: null,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to calculate AI acceptance rate:", error);
      throw new Error("Failed to fetch AI acceptance rate");
    }

    // RPC returns array with single row
    const result = data?.[0];

    if (!result) {
      // Return zero values if no data
      return {
        totalGenerated: 0,
        totalAccepted: 0,
        totalAcceptedEdited: 0,
        totalRejected: 0,
        acceptanceRate: 0,
      };
    }

    return {
      totalGenerated: Number(result.total_generated),
      totalAccepted: Number(result.total_accepted),
      totalAcceptedEdited: Number(result.total_accepted_edited),
      totalRejected: Number(result.total_rejected),
      acceptanceRate: Number(result.acceptance_rate),
    };
  }

  /**
   * Calculate AI flashcard share from flashcards table
   * Automatically filtered to current user via auth.uid()
   */
  private async getAIFlashcardShare(): Promise<AIFlashcardShareDto> {
    const { data, error } = await this.supabase.rpc("calculate_ai_flashcard_share", {
      p_start_date: null,
      p_end_date: null,
    });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to calculate AI flashcard share:", error);
      throw new Error("Failed to fetch AI flashcard share");
    }

    // RPC returns array with single row
    const result = data?.[0];

    if (!result) {
      // Return zero values if no data
      return {
        totalFlashcards: 0,
        aiFlashcards: 0,
        manualFlashcards: 0,
        aiSharePercentage: 0,
      };
    }

    return {
      totalFlashcards: Number(result.total_flashcards),
      aiFlashcards: Number(result.ai_flashcards),
      manualFlashcards: Number(result.manual_flashcards),
      aiSharePercentage: Number(result.ai_share_percentage),
    };
  }
}
