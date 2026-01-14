import { z } from "zod";

/**
 * Validation schema for POST /review-sessions
 * Validates:
 * - limit: optional, integer 1-50, default 20
 */
export const StartReviewSessionSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Validation schema for PATCH /review-sessions/flashcards/:id/answer
 * Validates:
 * - grade: required, integer 0-5 (SM-2 scale)
 */
export const SubmitAnswerSchema = z.object({
  grade: z
    .number({
      required_error: "GRADE_REQUIRED",
      invalid_type_error: "GRADE_INVALID",
    })
    .int({ message: "GRADE_MUST_BE_INTEGER" })
    .min(0, { message: "GRADE_TOO_LOW" })
    .max(5, { message: "GRADE_TOO_HIGH" }),
});

/**
 * Type inference from the schemas
 */
export type StartReviewSessionInput = z.infer<typeof StartReviewSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
