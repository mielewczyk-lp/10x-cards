import type { APIRoute } from "astro";

import type { ErrorResponseDto } from "../../../types";
import { StatsService } from "../../../lib/services/statsService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/stats
 *
 * Retrieves KPI statistics for the authenticated user:
 * 1. Calls SQL functions to calculate AI acceptance rate
 * 2. Calls SQL functions to calculate AI flashcard share
 * 3. Returns combined metrics
 *
 * @returns 200 OK with stats, or error response
 */
export const GET: APIRoute = async ({ locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;

  // Ensure user is authenticated
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          message: "UNAUTHORIZED",
        },
      } satisfies ErrorResponseDto),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Step 1: Fetch stats using the service
    // Note: User filtering is enforced by SQL functions using auth.uid()
    const statsService = new StatsService(supabase);
    const stats = await statsService.getStats();

    // Step 2: Return success response
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/stats:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: "INTERNAL_SERVER_ERROR",
        },
      } satisfies ErrorResponseDto),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
