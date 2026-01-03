import type { APIRoute } from "astro";
import { ZodError } from "zod";

import type { ErrorResponseDto } from "../../../types";
import { CreateFlashcardsSchema } from "../../../lib/validation/flashcardSchemas";
import {
  FlashcardService,
  GenerationSourceNotFoundError,
  GenerationSourceForbiddenError,
} from "../../../lib/services/flashcardService";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST /api/flashcards
 *
 * Creates new flashcards by:
 * 1. Validating the request body (array of flashcard commands)
 * 2. Verifying that any referenced generation sources exist and belong to the user
 * 3. Bulk inserting flashcards into the database
 * 4. Updating statistics in generation_sources table
 * 5. Returning the created flashcards
 *
 * @returns 201 Created with flashcard DTOs, or error response
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;

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

    const validatedData = CreateFlashcardsSchema.parse(body);

    // Step 2: Create flashcards using the service
    const flashcardService = new FlashcardService(supabase);
    const createdFlashcards = await flashcardService.createMany(validatedData, DEFAULT_USER_ID);

    // Step 3: Return success response
    return new Response(JSON.stringify(createdFlashcards), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle generation source not found
    if (error instanceof GenerationSourceNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "NOT_FOUND",
            fields: { generationSourceId: "GENERATION_SOURCE_NOT_FOUND" },
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle generation source forbidden (doesn't belong to user)
    if (error instanceof GenerationSourceForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "FORBIDDEN",
            fields: { generationSourceId: "GENERATION_SOURCE_FORBIDDEN" },
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
    console.error("Unexpected error in POST /api/flashcards:", error);
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
