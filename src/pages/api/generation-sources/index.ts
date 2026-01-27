import type { APIRoute } from "astro";
import { ZodError } from "zod";

import type { ErrorResponseDto } from "../../../types";
import { CreateGenerationSourceSchema } from "../../../lib/validation/generationSourceSchemas";
import { GenerationSourceService, AIServiceError } from "../../../lib/services/generationSourceService";
import { createFlashcardGenerationService } from "../../../lib/services/flashcardGenerationService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/generation-sources
 *
 * Creates a new generation source by:
 * 1. Validating the input text (1000-10000 characters)
 * 2. Creating a database record with initial stats
 * 3. Calling the AI service to generate flashcard candidates
 * 4. Updating the database record with results
 * 5. Returning the candidates to the client
 *
 * @returns 201 Created with candidates, or error response
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

    const validatedData = CreateGenerationSourceSchema.parse(body);

    // Step 2: Create services
    const apiKey = locals.runtime.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: {
            message: "AI service configuration error",
          },
        } satisfies ErrorResponseDto),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const flashcardService = createFlashcardGenerationService(apiKey);
    const generationSourceService = new GenerationSourceService(supabase, flashcardService);

    // Step 3: Create generation source
    const response = await generationSourceService.create(validatedData.inputText, user.id);

    // Step 4: Return success response
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle AI service errors
    if (error instanceof AIServiceError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "AI_SERVICE_UNAVAILABLE",
          },
        } satisfies ErrorResponseDto),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle validation errors
    if (error instanceof ZodError) {
      const firstError = error.errors[0];
      return new Response(
        JSON.stringify({
          error: {
            message: firstError.message || "INPUT_TEXT_INVALID",
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
    console.error("Unexpected error in POST /api/generation-sources:", error);
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
