import type { APIRoute } from "astro";
import { ZodError } from "zod";

import type { ErrorResponseDto } from "../../../types";
import { UpdateFlashcardSchema } from "../../../lib/validation/flashcardSchemas";
import {
  FlashcardService,
  FlashcardNotFoundError,
  FlashcardForbiddenError,
} from "../../../lib/services/flashcardService";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET /api/flashcards/:id
 *
 * Retrieves a single flashcard by ID:
 * 1. Validates the flashcard ID
 * 2. Verifies ownership
 * 3. Returns the flashcard
 *
 * @returns 200 OK with flashcard DTO, or error response
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          message: "FIELD_VALIDATION_FAILED",
          fields: { id: "ID_REQUIRED" },
        },
      } satisfies ErrorResponseDto),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Fetch flashcard using the service
    const flashcardService = new FlashcardService(supabase);
    const flashcard = await flashcardService.getById(id, user.id);

    // Return success response
    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle flashcard not found
    if (error instanceof FlashcardNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "NOT_FOUND",
            fields: { id: "FLASHCARD_NOT_FOUND" },
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle flashcard forbidden
    if (error instanceof FlashcardForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "FORBIDDEN",
            fields: { id: "FLASHCARD_FORBIDDEN" },
          },
        } satisfies ErrorResponseDto),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/flashcards/:id:", error);
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
 * PATCH /api/flashcards/:id
 *
 * Updates a flashcard:
 * 1. Validates the request body
 * 2. Verifies ownership
 * 3. Updates the flashcard (changes source_type to 'ai-edited' if it was 'ai-full')
 * 4. Returns the updated flashcard
 *
 * @returns 200 OK with updated flashcard DTO, or error response
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

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          message: "FIELD_VALIDATION_FAILED",
          fields: { id: "ID_REQUIRED" },
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

    const validatedData = UpdateFlashcardSchema.parse(body);

    // Step 2: Update flashcard using the service
    const flashcardService = new FlashcardService(supabase);
    const updatedFlashcard = await flashcardService.update(id, validatedData, user.id);

    // Step 3: Return success response
    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle flashcard not found
    if (error instanceof FlashcardNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "NOT_FOUND",
            fields: { id: "FLASHCARD_NOT_FOUND" },
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle flashcard forbidden
    if (error instanceof FlashcardForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "FORBIDDEN",
            fields: { id: "FLASHCARD_FORBIDDEN" },
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
    console.error("Unexpected error in PATCH /api/flashcards/:id:", error);
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
 * DELETE /api/flashcards/:id
 *
 * Deletes a flashcard:
 * 1. Verifies ownership
 * 2. Deletes the flashcard from database
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

  const { id } = params;

  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          message: "FIELD_VALIDATION_FAILED",
          fields: { id: "ID_REQUIRED" },
        },
      } satisfies ErrorResponseDto),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Delete flashcard using the service
    const flashcardService = new FlashcardService(supabase);
    await flashcardService.delete(id, user.id);

    // Return success response with no content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle flashcard not found
    if (error instanceof FlashcardNotFoundError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "NOT_FOUND",
            fields: { id: "FLASHCARD_NOT_FOUND" },
          },
        } satisfies ErrorResponseDto),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle flashcard forbidden
    if (error instanceof FlashcardForbiddenError) {
      return new Response(
        JSON.stringify({
          error: {
            message: "FORBIDDEN",
            fields: { id: "FLASHCARD_FORBIDDEN" },
          },
        } satisfies ErrorResponseDto),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in DELETE /api/flashcards/:id:", error);
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
