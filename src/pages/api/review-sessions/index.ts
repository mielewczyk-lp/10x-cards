import type { APIRoute } from "astro";
import { ZodError } from "zod";

import type { ErrorResponseDto } from "../../../types";
import { StartReviewSessionSchema } from "../../../lib/validation/reviewSessionSchemas";
import { ReviewSessionService, NoFlashcardsAvailableError } from "../../../lib/services/reviewSessionService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/review-sessions
 *
 * Starts a review session by fetching flashcards due for review:
 * 1. Validates request body (limit parameter)
 * 2. Fetches flashcards where next_review_at <= NOW()
 * 3. Returns flashcards with their SM-2 state
 *
 * @returns 200 OK with flashcards array and total count, or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
    // Step 1: Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validatedData = StartReviewSessionSchema.parse(body);

    // Step 2: Fetch flashcards for review using the service
    const reviewSessionService = new ReviewSessionService(supabase);
    const response = await reviewSessionService.getFlashcardsForReview(user.id, validatedData.limit);

    // Step 3: Return success response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle no flashcards available (not an error, just empty state)
    if (error instanceof NoFlashcardsAvailableError) {
      return new Response(
        JSON.stringify({
          flashcards: [],
          total: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle validation errors
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "FIELD_VALIDATION_FAILED",
            fields: error.errors.reduce(
              (acc, err) => {
                const path = err.path.join(".");
                acc[path] = err.message;
                return acc;
              },
              {} as Record<string, string>
            ),
          },
        } satisfies ErrorResponseDto),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in POST /api/review-sessions:", error);
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
