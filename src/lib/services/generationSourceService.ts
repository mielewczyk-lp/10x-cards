import crypto from "node:crypto";

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateGenerationSourceResponseDto,
  ErrorLogDto,
  FlashcardCandidateDto,
  GenerationSourceInsert,
  GenerationSourceUpdate,
  UpdateGenerationSourceCommand,
} from "../../types";
import type { FlashcardGenerationService } from "./flashcardGenerationService";

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
 * Error thrown when a generation source is not found
 */
export class GenerationSourceNotFoundError extends Error {
  constructor(id: string) {
    super(`Generation source with id ${id} not found`);
    this.name = "GenerationSourceNotFoundError";
  }
}

/**
 * Error thrown when a generation source doesn't belong to the user
 */
export class GenerationSourceForbiddenError extends Error {
  constructor(id: string) {
    super(`Generation source with id ${id} does not belong to the user`);
    this.name = "GenerationSourceForbiddenError";
  }
}

/**
 * Service responsible for managing generation sources
 */
export class GenerationSourceService {
  constructor(
    private supabase: SupabaseClient,
    private flashcardGenerationService: FlashcardGenerationService
  ) {}

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
      const result = await this.flashcardGenerationService.generate(inputText);
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

  /**
   * Update telemetry statistics for a generation source after user review
   *
   * @param id - ID of the generation source to update
   * @param command - Statistics to update
   * @param userId - ID of the user updating the generation source
   * @throws GenerationSourceNotFoundError if generation source doesn't exist
   * @throws GenerationSourceForbiddenError if generation source doesn't belong to user
   */
  async updateStats(id: string, command: UpdateGenerationSourceCommand, userId: string): Promise<void> {
    // Step 1: Verify ownership and existence
    const { data: existingSource, error: fetchError } = await this.supabase
      .from("generation_sources")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch generation source ${id}:`, fetchError);
      throw new Error("Failed to fetch generation source");
    }

    if (!existingSource) {
      throw new GenerationSourceNotFoundError(id);
    }

    if (existingSource.user_id !== userId) {
      throw new GenerationSourceForbiddenError(id);
    }

    // Step 2: Prepare update data
    const updateData: GenerationSourceUpdate = {};

    if (command.totalAccepted !== undefined) {
      updateData.total_accepted = command.totalAccepted;
    }

    if (command.totalAcceptedEdited !== undefined) {
      updateData.total_accepted_edited = command.totalAcceptedEdited;
    }

    if (command.totalRejected !== undefined) {
      updateData.total_rejected = command.totalRejected;
    }

    // Step 3: Guard - if no updates, return early
    if (Object.keys(updateData).length === 0) {
      return;
    }

    // Step 4: Execute update
    const { error: updateError } = await this.supabase
      .from("generation_sources")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      // eslint-disable-next-line no-console
      console.error(`Failed to update generation source ${id}:`, updateError);
      throw new Error("Failed to update generation source statistics");
    }
  }

  /**
   * List all generation sources with errors (error_message IS NOT NULL)
   *
   * @param userId - ID of the user
   * @returns Array of error logs
   */
  async listErrors(userId: string): Promise<ErrorLogDto[]> {
    // Fetch all error logs for the user
    const { data: errorLogs, error: fetchError } = await this.supabase
      .from("generation_sources")
      .select("id, error_message, created_at")
      .eq("user_id", userId)
      .not("error_message", "is", null)
      .order("created_at", { ascending: false });

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch error logs:", fetchError);
      throw new Error("Failed to fetch error logs");
    }

    // Map to DTOs (happy path)
    return (errorLogs ?? []).map((log) => ({
      id: log.id,
      errorMessage: log.error_message ?? "",
      createdAt: log.created_at,
    }));
  }

  /**
   * Delete a generation source
   *
   * @param id - ID of the generation source to delete
   * @param userId - ID of the user
   * @throws GenerationSourceNotFoundError if generation source doesn't exist
   * @throws GenerationSourceForbiddenError if generation source doesn't belong to user
   */
  async delete(id: string, userId: string): Promise<void> {
    // Step 1: Verify ownership and existence
    const { data: existingSource, error: fetchError } = await this.supabase
      .from("generation_sources")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch generation source ${id}:`, fetchError);
      throw new Error("Failed to fetch generation source");
    }

    if (!existingSource) {
      throw new GenerationSourceNotFoundError(id);
    }

    if (existingSource.user_id !== userId) {
      throw new GenerationSourceForbiddenError(id);
    }

    // Step 2: Delete the generation source
    const { error: deleteError } = await this.supabase
      .from("generation_sources")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      // eslint-disable-next-line no-console
      console.error(`Failed to delete generation source ${id}:`, deleteError);
      throw new Error("Failed to delete generation source");
    }
  }
}
