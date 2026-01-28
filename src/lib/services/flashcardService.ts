import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateFlashcardCommand,
  FlashcardDto,
  FlashcardInsert,
  FlashcardUpdate,
  GenerationSourceUpdate,
  ListFlashcardsQuery,
  PaginatedFlashcardsDto,
  UpdateFlashcardCommand,
} from "../../types";

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
 * Error thrown when a flashcard is not found
 */
export class FlashcardNotFoundError extends Error {
  constructor(id: string) {
    super(`Flashcard with id ${id} not found`);
    this.name = "FlashcardNotFoundError";
  }
}

/**
 * Error thrown when a flashcard doesn't belong to the user
 */
export class FlashcardForbiddenError extends Error {
  constructor(id: string) {
    super(`Flashcard with id ${id} does not belong to the user`);
    this.name = "FlashcardForbiddenError";
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

  /**
   * Get paginated list of flashcards with optional search and sorting
   *
   * @param query - List query parameters (search, pagination, sorting)
   * @param userId - ID of the user fetching flashcards
   * @returns Paginated flashcards response
   */
  async list(query: ListFlashcardsQuery, userId: string): Promise<PaginatedFlashcardsDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sort = query.sort ?? "created_at";
    const order = query.order ?? "desc";
    const searchQuery = query.q?.trim();

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build base query
    let dbQuery = this.supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply full-text search if provided
    if (searchQuery) {
      // Use Postgres full-text search on search_vector column
      dbQuery = dbQuery.textSearch("search_vector", searchQuery, {
        type: "websearch",
        config: "simple",
      });
    }

    // Apply sorting
    dbQuery = dbQuery.order(sort, { ascending: order === "asc" });

    // Apply pagination
    dbQuery = dbQuery.range(offset, offset + pageSize - 1);

    // Execute query
    const { data: flashcards, error, count } = await dbQuery;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to fetch flashcards:", error);
      throw new Error("Failed to fetch flashcards");
    }

    // Calculate total pages
    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Map to DTOs
    const items: FlashcardDto[] = (flashcards ?? []).map((flashcard) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      sourceType: flashcard.source_type as FlashcardDto["sourceType"],
      generationSourceId: flashcard.generation_source_id,
      createdAt: flashcard.created_at,
      updatedAt: flashcard.updated_at,
    }));

    return {
      items,
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  /**
   * Get a single flashcard by ID
   *
   * @param id - Flashcard ID
   * @param userId - ID of the user fetching the flashcard
   * @returns Flashcard DTO
   * @throws FlashcardNotFoundError if flashcard doesn't exist
   * @throws FlashcardForbiddenError if flashcard doesn't belong to user
   */
  async getById(id: string, userId: string): Promise<FlashcardDto> {
    const { data: flashcard, error } = await this.supabase.from("flashcards").select("*").eq("id", id).maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch flashcard ${id}:`, error);
      throw new Error("Failed to fetch flashcard");
    }

    if (!flashcard) {
      throw new FlashcardNotFoundError(id);
    }

    if (flashcard.user_id !== userId) {
      throw new FlashcardForbiddenError(id);
    }

    return {
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      sourceType: flashcard.source_type as FlashcardDto["sourceType"],
      generationSourceId: flashcard.generation_source_id,
      createdAt: flashcard.created_at,
      updatedAt: flashcard.updated_at,
    };
  }

  /**
   * Update a flashcard
   *
   * @param id - Flashcard ID
   * @param command - Update command with fields to change
   * @param userId - ID of the user updating the flashcard
   * @returns Updated flashcard DTO
   * @throws FlashcardNotFoundError if flashcard doesn't exist
   * @throws FlashcardForbiddenError if flashcard doesn't belong to user
   */
  async update(id: string, command: UpdateFlashcardCommand, userId: string): Promise<FlashcardDto> {
    // First, verify ownership and get current flashcard
    const currentFlashcard = await this.getById(id, userId);

    // Prepare update data
    const updateData: FlashcardUpdate = {};

    if (command.front !== undefined) {
      updateData.front = command.front;
    }

    if (command.back !== undefined) {
      updateData.back = command.back;
    }

    // If the flashcard was AI-generated and is being edited, change source_type to 'ai-edited'
    if (currentFlashcard.sourceType === "ai-full" && Object.keys(updateData).length > 0) {
      updateData.source_type = "ai-edited";
    }

    // Execute update
    const { data: updatedFlashcard, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !updatedFlashcard) {
      // eslint-disable-next-line no-console
      console.error(`Failed to update flashcard ${id}:`, error);
      throw new Error("Failed to update flashcard");
    }

    return {
      id: updatedFlashcard.id,
      front: updatedFlashcard.front,
      back: updatedFlashcard.back,
      sourceType: updatedFlashcard.source_type as FlashcardDto["sourceType"],
      generationSourceId: updatedFlashcard.generation_source_id,
      createdAt: updatedFlashcard.created_at,
      updatedAt: updatedFlashcard.updated_at,
    };
  }

  /**
   * Delete a flashcard
   *
   * @param id - Flashcard ID
   * @param userId - ID of the user deleting the flashcard
   * @throws FlashcardNotFoundError if flashcard doesn't exist
   * @throws FlashcardForbiddenError if flashcard doesn't belong to user
   */
  async delete(id: string, userId: string): Promise<void> {
    // First, verify ownership
    await this.getById(id, userId);

    // Execute delete
    const { error } = await this.supabase.from("flashcards").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to delete flashcard ${id}:`, error);
      throw new Error("Failed to delete flashcard");
    }
  }
}
