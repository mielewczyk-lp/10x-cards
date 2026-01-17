import type { APIRoute } from "astro";
import { LearningStatsService } from "@/lib/services/learningStatsService";
import type { LearningStatsResponseDto } from "@/types";

export const prerender = false;

/**
 * GET /api/stats/learning
 *
 * Returns learning statistics for the authenticated user
 * Metrics calculated from flashcards table using SM-2 columns
 *
 * @returns Learning statistics (mastery distribution, due cards, totals)
 */
export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;

  // Step 1: Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(
      JSON.stringify({
        error: {
          message: "Unauthorized",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Step 2: Calculate statistics using service
  try {
    const statsService = new LearningStatsService(supabase);
    const stats: LearningStatsResponseDto = await statsService.getStats();

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to calculate learning stats:", error);

    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "Failed to fetch learning statistics",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
