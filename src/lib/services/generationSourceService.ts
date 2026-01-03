import crypto from "node:crypto";

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateGenerationSourceResponseDto,
  FlashcardCandidateDto,
  GenerationSourceInsert,
  GenerationSourceUpdate,
} from "../../types";
import { flashcardGenerationService } from "./flashcardGenerationService";

/**
 * Error thrown when the AI service is unavailable or returns an error
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Service responsible for managing generation sources
 */
export class GenerationSourceService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new generation source and generate flashcard candidates
   *
   * @param inputText - The input text to generate flashcards from
   * @param userId - ID of the user creating the generation source
   * @returns Generation source with candidates
   * @throws AIServiceError if AI generation fails
   */
  async create(inputText: string, userId: string): Promise<CreateGenerationSourceResponseDto> {
    // Hash the input text using MD5
    const inputTextHash = crypto.createHash("md5").update(inputText).digest("hex");

    // Step 1: Insert initial record in generation_sources table
    const insertData: GenerationSourceInsert = {
      user_id: userId,
      input_text_hash: inputTextHash,
      total_generated: 0,
      total_accepted: 0,
      total_accepted_edited: 0,
      total_rejected: 0,
      model_name: null,
      error_message: null,
    };

    const { data: generationSource, error: insertError } = await this.supabase
      .from("generation_sources")
      .insert(insertData)
      .select()
      .single();

    if (insertError || !generationSource) {
      // eslint-disable-next-line no-console
      console.error("Failed to insert generation source:", insertError);
      throw new Error("Failed to create generation source");
    }

    // Step 2: Call AI service to generate flashcard candidates
    let candidates: FlashcardCandidateDto[];
    let modelName: string;

    try {
      const result = await flashcardGenerationService.generate(inputText);
      candidates = result.candidates;
      modelName = result.modelName;
    } catch (error) {
      // Handle AI service errors - update record with error and re-throw
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await this.supabase
        .from("generation_sources")
        .update({
          error_message: errorMessage,
        } satisfies GenerationSourceUpdate)
        .eq("id", generationSource.id);

      throw new AIServiceError(errorMessage, 502);
    }

    // Step 3: Update the record with successful generation results
    const { error: updateError } = await this.supabase
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

    // Step 4: Return success response with candidates (happy path)
    return {
      id: generationSource.id,
      createdAt: generationSource.created_at,
      candidates,
    };
  }
}
