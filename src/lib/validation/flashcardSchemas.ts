import { z } from "zod";

/**
 * Valid source types for flashcards
 */
const FLASHCARD_SOURCE_TYPES = ["ai-full", "ai-edited", "manual"] as const;

/**
 * Validation schema for a single flashcard in POST /flashcards request
 * Validates:
 * - front: required, trimmed, 1-200 characters
 * - back: required, trimmed, 1-500 characters
 * - sourceType: required, one of: ai-full, ai-edited, manual
 * - generationSourceId: optional UUID or null
 */
export const CreateFlashcardSchema = z.object({
  front: z
    .string({
      required_error: "FRONT_REQUIRED",
      invalid_type_error: "FRONT_INVALID",
    })
    .trim()
    .min(1, { message: "FRONT_REQUIRED" })
    .max(200, { message: "FRONT_TOO_LONG" }),
  back: z
    .string({
      required_error: "BACK_REQUIRED",
      invalid_type_error: "BACK_INVALID",
    })
    .trim()
    .min(1, { message: "BACK_REQUIRED" })
    .max(500, { message: "BACK_TOO_LONG" }),
  sourceType: z.enum(FLASHCARD_SOURCE_TYPES, {
    required_error: "SOURCE_TYPE_REQUIRED",
    invalid_type_error: "SOURCE_TYPE_INVALID",
  }),
  generationSourceId: z.string().uuid({ message: "GENERATION_SOURCE_ID_INVALID" }).nullable().optional(),
});

/**
 * Validation schema for POST /flashcards
 * Expects an array of flashcard objects
 */
export const CreateFlashcardsSchema = z
  .array(CreateFlashcardSchema)
  .min(1, { message: "AT_LEAST_ONE_FLASHCARD_REQUIRED" })
  .max(50, { message: "TOO_MANY_FLASHCARDS" });

/**
 * Type inference from the schemas
 */
export type CreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;
export type CreateFlashcardsInput = z.infer<typeof CreateFlashcardsSchema>;
