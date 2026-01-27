import type { APIRoute } from "astro";
import { ZodError } from "zod";

import type { ErrorResponseDto } from "../../../types";
import { UpdateGenerationSourceSchema } from "../../../lib/validation/generationSourceSchemas";
import {
  GenerationSourceService,
  GenerationSourceNotFoundError,
  GenerationSourceForbiddenError,
} from "../../../lib/services/generationSourceService";
import { createFlashcardGenerationService } from "../../../lib/services/flashcardGenerationService";
import { getEnv } from "../../../lib/env";

// Disable prerendering for this API route
export const prerender = false;

/**
 * PATCH /api/generation-sources/:id
 *
 * Updates telemetry statistics for a generation source after user review:
 * 1. Validates the request body
 * 2. Verifies ownership of the generation source
 * 3. Updates statistics in the database
 *
 * @returns 200 OK, or error response
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

  // Validate ID parameter
  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          message: "INVALID_ID",
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

    const validatedData = UpdateGenerationSourceSchema.parse(body);

    // Step 2: Create service (FlashcardGenerationService not needed for update, but constructor requires it)
    const apiKey = getEnv(locals, "OPENROUTER_API_KEY");
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

    // Step 3: Update generation source statistics
    await generationSourceService.updateStats(id, validatedData, user.id);

    // Step 4: Return success response
    return new Response(null, { status: 200 });
  } catch (error) {
    // Handle generation source not found
    if (error instanceof GenerationSourceNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "NOT_FOUND",
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
    console.error("Unexpected error in PATCH /api/generation-sources/:id:", error);
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

/**
 * DELETE /api/generation-sources/:id
 *
 * Deletes a generation source (typically used for removing error logs):
 * 1. Verifies ownership
 * 2. Deletes the generation source from database
 * 3. Returns success response
 *
 * @returns 204 No Content on success, or error response
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

  // Validate ID parameter
  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          message: "INVALID_ID",
        },
      } satisfies ErrorResponseDto),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Create service (FlashcardGenerationService not needed for delete, but constructor requires it)
    const apiKey = getEnv(locals, "OPENROUTER_API_KEY");
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

    // Delete generation source using the service
    await generationSourceService.delete(id, user.id);

    // Return success response with no content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle generation source not found
    if (error instanceof GenerationSourceNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "NOT_FOUND",
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
          },
        } satisfies ErrorResponseDto),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/generation-sources/:id:", error);
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
