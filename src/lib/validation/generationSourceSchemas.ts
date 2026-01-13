import { z } from "zod";

/**
 * Validation schema for POST /generation-sources
 * Validates the inputText field according to business rules:
 * - Required field
 * - After trimming whitespace, must be between 1000 and 10000 characters
 */
export const CreateGenerationSourceSchema = z.object({
  inputText: z
    .string({
      required_error: "INPUT_TEXT_INVALID",
      invalid_type_error: "INPUT_TEXT_INVALID",
    })
    .trim()
    .min(1000, { message: "INPUT_TEXT_INVALID" })
    .max(10000, { message: "INPUT_TEXT_INVALID" }),
});

/**
 * Type inference from the schema
 */
export type CreateGenerationSourceInput = z.infer<typeof CreateGenerationSourceSchema>;

/**
 * Validation schema for PATCH /generation-sources/:id
 * Updates telemetry statistics after user review of candidates
 */
export const UpdateGenerationSourceSchema = z.object({
  totalAccepted: z.number().int().min(0).optional(),
  totalAcceptedEdited: z.number().int().min(0).optional(),
  totalRejected: z.number().int().min(0).optional(),
});

/**
 * Type inference from the schema
 */
export type UpdateGenerationSourceInput = z.infer<typeof UpdateGenerationSourceSchema>;
