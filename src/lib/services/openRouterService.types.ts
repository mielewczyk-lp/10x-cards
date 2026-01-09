import { z } from "astro:schema";
import type { FlashcardCandidateDto } from "../../types";

// =============================================================================
// TYPE DEFINITIONS & INTERFACES
// =============================================================================

/**
 * Model parameters for controlling LLM behavior
 */
export interface ModelParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * JSON Schema format for structured responses
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
      additionalProperties: boolean;
    };
  };
}

/**
 * Options for chat completion request
 */
export interface ChatCompletionOptions {
  /** System message defining the role/behavior of the model */
  system: string;
  /** User message with the actual request */
  user: string;
  /** Full model name (e.g., "openai/gpt-4o-mini") */
  model: string;
  /** Response format schema for structured output */
  responseFormat: ResponseFormat;
  /** Optional model parameters */
  parameters?: ModelParams;
  /** Optional timeout in milliseconds (default: 60000) */
  timeoutMs?: number;
}

/**
 * Response from LLM
 */
export interface LLMResponse<T = unknown> {
  /** Parsed JSON content from the response */
  content: T;
  /** Model that was used */
  model: string;
  /** Number of tokens used in the request */
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Internal OpenRouter API request payload
 */
export interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Internal OpenRouter API response structure
 */
export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Error response from OpenRouter API
 */
export interface OpenRouterErrorResponse {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

/**
 * Response type for flashcard generation
 */
export interface FlashcardGenerationResponse {
  flashcards: FlashcardCandidateDto[];
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

/**
 * Zod schema for validating ChatCompletionOptions
 */
export const chatCompletionOptionsSchema = z.object({
  system: z.string().min(1, "System message cannot be empty"),
  user: z.string().min(1, "User message cannot be empty"),
  model: z.string().min(1, "Model name is required"),
  responseFormat: z.object({
    type: z.literal("json_schema"),
    json_schema: z.object({
      name: z.string(),
      strict: z.boolean(),
      schema: z.object({
        type: z.literal("object"),
        properties: z.record(z.unknown()),
        required: z.array(z.string()),
        additionalProperties: z.boolean(),
      }),
    }),
  }),
  parameters: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      max_tokens: z.number().int().positive().optional(),
      top_p: z.number().min(0).max(1).optional(),
      frequency_penalty: z.number().min(-2).max(2).optional(),
      presence_penalty: z.number().min(-2).max(2).optional(),
    })
    .optional(),
  timeoutMs: z.number().int().positive().optional(),
});

/**
 * Zod schema for validating OpenRouter API response
 */
export const openRouterResponseSchema = z.object({
  id: z.string(),
  model: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
      finish_reason: z.string(),
    })
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number(),
    })
    .optional(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Create response format for flashcard generation
 */
export function createFlashcardResponseFormat(): ResponseFormat {
  return {
    type: "json_schema",
    json_schema: {
      name: "FlashcardSet",
      strict: true,
      schema: {
        type: "object",
        properties: {
          flashcards: {
            type: "array",
            items: {
              type: "object",
              properties: {
                front: { type: "string" },
                back: { type: "string" },
              },
              required: ["front", "back"],
              additionalProperties: false,
            },
          },
        },
        required: ["flashcards"],
        additionalProperties: false,
      },
    },
  };
}
