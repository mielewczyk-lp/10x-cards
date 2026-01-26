/*
 * Entity Aliases
 *
 * Aliases for database entities to make them easier to reference.
 * Types are derived from database entities declared in `src/db/database.types.ts`.
 */

import type { Tables, TablesInsert, TablesUpdate } from "../db/database.types";

// -----------------------------------------------------------------------------
// FLASHCARD ENTITIES
// -----------------------------------------------------------------------------

export type FlashcardEntity = Tables<"flashcards">;
export type FlashcardInsert = TablesInsert<"flashcards">;
export type FlashcardUpdate = TablesUpdate<"flashcards">;

// -----------------------------------------------------------------------------
// GENERATION SOURCE ENTITIES
// -----------------------------------------------------------------------------

export type GenerationSourceEntity = Tables<"generation_sources">;
export type GenerationSourceInsert = TablesInsert<"generation_sources">;
export type GenerationSourceUpdate = TablesUpdate<"generation_sources">;
