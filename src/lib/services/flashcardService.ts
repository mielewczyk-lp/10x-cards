import type { SupabaseClient } from "../../db/supabase.client";
import type { CreateFlashcardCommand, FlashcardDto, FlashcardInsert, GenerationSourceUpdate } from "../../types";

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
 * Service responsible for managing flashcards
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create multiple flashcards in a single transaction
   *
   * @param commands - Array of flashcard creation commands
   * @param userId - ID of the user creating the flashcards
   * @returns Array of created flashcards as DTOs
   * @throws GenerationSourceNotFoundError if any generationSourceId doesn't exist
   * @throws GenerationSourceForbiddenError if any generationSourceId doesn't belong to user
   */
  async createMany(commands: CreateFlashcardCommand[], userId: string): Promise<FlashcardDto[]> {
    // Step 1: Validate generation source IDs if provided
    const generationSourceIds = commands.map((cmd) => cmd.generationSourceId).filter((id): id is string => id != null);

    if (generationSourceIds.length > 0) {
      await this.validateGenerationSources(generationSourceIds, userId);
    }

    // Step 2: Prepare flashcard records for bulk insert
    const flashcardsToInsert: FlashcardInsert[] = commands.map((cmd) => ({
      user_id: userId,
      front: cmd.front,
      back: cmd.back,
      source_type: cmd.sourceType,
      generation_source_id: cmd.generationSourceId ?? null,
    }));

    // Step 3: Bulk insert flashcards
    const { data: createdFlashcards, error: insertError } = await this.supabase
      .from("flashcards")
      .insert(flashcardsToInsert)
      .select();

    if (insertError || !createdFlashcards) {
      // eslint-disable-next-line no-console
      console.error("Failed to insert flashcards:", insertError);
      throw new Error("Failed to create flashcards");
    }

    // Step 4: Update generation source statistics
    await this.updateGenerationSourceStats(commands, userId);

    // Step 5: Map to DTOs and return
    return createdFlashcards.map((flashcard) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      sourceType: flashcard.source_type as FlashcardDto["sourceType"],
      generationSourceId: flashcard.generation_source_id,
      createdAt: flashcard.created_at,
      updatedAt: flashcard.updated_at,
    }));
  }

  /**
   * Validate that all generation source IDs exist and belong to the user
   */
  private async validateGenerationSources(generationSourceIds: string[], userId: string): Promise<void> {
    // Get unique IDs to avoid duplicate queries
    const uniqueIds = [...new Set(generationSourceIds)];

    const { data: sources, error } = await this.supabase
      .from("generation_sources")
      .select("id, user_id")
      .in("id", uniqueIds);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to validate generation sources:", error);
      throw new Error("Failed to validate generation sources");
    }

    // Check if all IDs were found
    if (!sources || sources.length !== uniqueIds.length) {
      const foundIds = sources?.map((s) => s.id) || [];
      const missingId = uniqueIds.find((id) => !foundIds.includes(id));
      throw new GenerationSourceNotFoundError(missingId || "unknown");
    }

    // Check if all sources belong to the user
    const foreignSource = sources.find((s) => s.user_id !== userId);
    if (foreignSource) {
      throw new GenerationSourceForbiddenError(foreignSource.id);
    }
  }

  /**
   * Update statistics in generation_sources table based on created flashcards
   */
  private async updateGenerationSourceStats(commands: CreateFlashcardCommand[], userId: string): Promise<void> {
    // Group flashcards by generation source ID and source type
    const statsBySourceId = new Map<string, { accepted: number; acceptedEdited: number }>();

    for (const cmd of commands) {
      if (!cmd.generationSourceId || cmd.sourceType === "manual") {
        continue;
      }

      const existing = statsBySourceId.get(cmd.generationSourceId) || {
        accepted: 0,
        acceptedEdited: 0,
      };

      if (cmd.sourceType === "ai-full") {
        existing.accepted++;
      } else if (cmd.sourceType === "ai-edited") {
        existing.acceptedEdited++;
      }

      statsBySourceId.set(cmd.generationSourceId, existing);
    }

    // Update each generation source with incremented statistics
    const updatePromises = Array.from(statsBySourceId.entries()).map(async ([sourceId, stats]) => {
      // First, fetch current values
      const { data: source, error: fetchError } = await this.supabase
        .from("generation_sources")
        .select("total_accepted, total_accepted_edited")
        .eq("id", sourceId)
        .eq("user_id", userId)
        .single();

      if (fetchError || !source) {
        // eslint-disable-next-line no-console
        console.error(`Failed to fetch generation source ${sourceId}:`, fetchError);
        return;
      }

      // Update with incremented values
      const updateData: GenerationSourceUpdate = {
        total_accepted: source.total_accepted + stats.accepted,
        total_accepted_edited: source.total_accepted_edited + stats.acceptedEdited,
      };

      const { error: updateError } = await this.supabase
        .from("generation_sources")
        .update(updateData)
        .eq("id", sourceId)
        .eq("user_id", userId);

      if (updateError) {
        // eslint-disable-next-line no-console
        console.error(`Failed to update generation source ${sourceId}:`, updateError);
      }
    });

    // Execute all updates in parallel
    await Promise.all(updatePromises);
  }
}
