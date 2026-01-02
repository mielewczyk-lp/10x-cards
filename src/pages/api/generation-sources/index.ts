import type { APIRoute } from "astro";
import { ZodError } from "zod";
import crypto from "node:crypto";

import type {
  CreateGenerationSourceResponseDto,
  ErrorResponseDto,
  GenerationSourceInsert,
  GenerationSourceUpdate,
} from "../../../types";
import { CreateGenerationSourceSchema } from "../../../lib/validation/generationSourceSchemas";
import { flashcardGenerationService, AIServiceError } from "../../../lib/services/flashcardGenerationService";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

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

    // Hash the input text using MD5
    const inputTextHash = crypto.createHash("md5").update(validatedData.inputText).digest("hex");

    // Step 2: Insert initial record in generation_sources table
    const insertData: GenerationSourceInsert = {
      user_id: DEFAULT_USER_ID,
      input_text_hash: inputTextHash,
      total_generated: 0,
      total_accepted: 0,
      total_accepted_edited: 0,
      total_rejected: 0,
      model_name: null,
      error_message: null,
    };

    const { data: generationSource, error: insertError } = await supabase
      .from("generation_sources")
      .insert(insertData)
      .select()
      .single();

    if (insertError || !generationSource) {
      // eslint-disable-next-line no-console
      console.error("Failed to insert generation source:", insertError);
      return new Response(
        JSON.stringify({
          error: {
            message: "Failed to create generation source",
          },
        } satisfies ErrorResponseDto),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Call AI service to generate flashcard candidates
    let candidates;
    let modelName;
    let errorMessage: string | null = null;

    try {
      const result = await flashcardGenerationService.generate(validatedData.inputText);
      candidates = result.candidates;
      modelName = result.modelName;
    } catch (error) {
      // Handle AI service errors
      if (error instanceof AIServiceError) {
        errorMessage = error.message;

        // Update the record with error information
        await supabase
          .from("generation_sources")
          .update({
            error_message: errorMessage,
          } satisfies GenerationSourceUpdate)
          .eq("id", generationSource.id);

        return new Response(
          JSON.stringify({
            error: {
              message: "AI_SERVICE_UNAVAILABLE",
            },
          } satisfies ErrorResponseDto),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      // Unexpected error
      // eslint-disable-next-line no-console
      console.error("Unexpected error during flashcard generation:", error);
      errorMessage = error instanceof Error ? error.message : "Unknown error";

      await supabase
        .from("generation_sources")
        .update({
          error_message: errorMessage,
        } satisfies GenerationSourceUpdate)
        .eq("id", generationSource.id);

      return new Response(
        JSON.stringify({
          error: {
            message: "INTERNAL_SERVER_ERROR",
          },
        } satisfies ErrorResponseDto),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 4: Update the record with successful generation results
    const { error: updateError } = await supabase
      .from("generation_sources")
      .update({
        total_generated: candidates.length,
        model_name: modelName,
      } satisfies GenerationSourceUpdate)
      .eq("id", generationSource.id);

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error("Failed to update generation source:", updateError);
      // We still return success since generation worked, but log the error
    }

    // Step 5: Return success response with candidates
    const response: CreateGenerationSourceResponseDto = {
      id: generationSource.id,
      createdAt: generationSource.created_at,
      candidates,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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
