import type { APIRoute } from "astro";
import { ZodError } from "zod";

import type { ErrorResponseDto } from "../../../../../types";
import { SubmitAnswerSchema } from "../../../../../lib/validation/reviewSessionSchemas";
import {
  ReviewSessionService,
  ReviewFlashcardNotFoundError,
  ReviewFlashcardForbiddenError,
} from "../../../../../lib/services/reviewSessionService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * PATCH /api/review-sessions/flashcards/:id/answer
 *
 * Submits user's answer for a flashcard and updates SM-2 state:
 * 1. Validates request body (grade 0-5)
 * 2. Fetches current flashcard with SM-2 state
 * 3. Calculates new SM-2 state using supermemo library
 * 4. Updates flashcard in database with new state and next_review_at
 * 5. Returns next review date and optionally next flashcard
 *
 * @returns 200 OK with next review info, or error response
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  const supabase = locals.supabase;
  const user = locals.user;
  const flashcardId = params.id;

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

  // Validate flashcard ID
  if (!flashcardId) {
    return new Response(
      JSON.stringify({
        error: {
          message: "FLASHCARD_ID_REQUIRED",
        },
      } satisfies ErrorResponseDto),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Step 1: Parse and validate request body
    const body = await request.json().catch(() => null);

    if (!body) {
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid JSON body",
            fields: { body: "REQUEST_BODY_INVALID" },
          },
        } satisfies ErrorResponseDto),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validatedData = SubmitAnswerSchema.parse(body);

    // Step 2: Submit answer using the service
    const reviewSessionService = new ReviewSessionService(supabase);
    const response = await reviewSessionService.submitAnswer(user.id, flashcardId, validatedData.grade);

    // Step 3: Return success response
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle flashcard not found
    if (error instanceof ReviewFlashcardNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "FLASHCARD_NOT_FOUND",
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle flashcard forbidden (doesn't belong to user)
    if (error instanceof ReviewFlashcardForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "FORBIDDEN",
          },
        } satisfies ErrorResponseDto),
        { status: 403, headers: { "Content-Type": "application/json" } }
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
    console.error("Unexpected error in PATCH /api/review-sessions/flashcards/:id/answer:", error);
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
