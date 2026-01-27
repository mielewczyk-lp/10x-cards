import type { APIRoute } from "astro";

import type { ErrorLogsResponseDto, ErrorResponseDto } from "../../../types";
import { GenerationSourceService } from "../../../lib/services/generationSourceService";
import { createFlashcardGenerationService } from "../../../lib/services/flashcardGenerationService";
import { getEnv } from "../../../lib/env";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/generation-sources/errors
 *
 * Lists all generation sources with errors (error_message IS NOT NULL)
 * Sorted by created_at DESC
 *
 * @returns 200 OK with array of error logs, or error response
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
    // Step 1: Create service (we pass a dummy flashcard service since we don't need it for listing)
    const apiKey = getEnv("OPENROUTER_API_KEY", locals.runtime) ?? "";
    const flashcardService = createFlashcardGenerationService(apiKey);
    const generationSourceService = new GenerationSourceService(supabase, flashcardService);

    // Step 2: Fetch all error logs
    const errors = await generationSourceService.listErrors(user.id);

    // Step 3: Return success response (happy path)
    return new Response(
      JSON.stringify({
        errors,
      } satisfies ErrorLogsResponseDto),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/generation-sources/errors:", error);
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
