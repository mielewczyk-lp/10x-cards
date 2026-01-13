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
 * Validation schema for PATCH /flashcards/:id
 * At least one field must be provided
 */
export const UpdateFlashcardSchema = z
  .object({
    front: z
      .string({
        invalid_type_error: "FRONT_INVALID",
      })
      .trim()
      .min(1, { message: "FRONT_REQUIRED" })
      .max(200, { message: "FRONT_TOO_LONG" })
      .optional(),
    back: z
      .string({
        invalid_type_error: "BACK_INVALID",
      })
      .trim()
      .min(1, { message: "BACK_REQUIRED" })
      .max(500, { message: "BACK_TOO_LONG" })
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "AT_LEAST_ONE_FIELD_REQUIRED",
  });

/**
 * Valid sort options for flashcard list queries
 */
const FLASHCARD_SORT_OPTIONS = ["created_at", "updated_at"] as const;

/**
 * Valid sort order
 */
const SORT_ORDER = ["asc", "desc"] as const;

/**
 * Validation schema for GET /flashcards query parameters
 */
export const ListFlashcardsQuerySchema = z.object({
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(FLASHCARD_SORT_OPTIONS).default("created_at"),
  order: z.enum(SORT_ORDER).default("desc"),
});

/**
 * Type inference from the schemas
 */
export type CreateFlashcardInput = z.infer<typeof CreateFlashcardSchema>;
export type CreateFlashcardsInput = z.infer<typeof CreateFlashcardsSchema>;
export type UpdateFlashcardInput = z.infer<typeof UpdateFlashcardSchema>;
export type ListFlashcardsQueryInput = z.infer<typeof ListFlashcardsQuerySchema>;
