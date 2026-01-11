import {
  APIError,
  AuthenticationError,
  RateLimitError,
  SchemaValidationError,
  TimeoutError,
  ValidationError,
} from "../errors/openRouterErrors";
import { chatCompletionOptionsSchema, openRouterResponseSchema } from "./openRouterService.types";
import type {
  ChatCompletionOptions,
  LLMResponse,
  OpenRouterErrorResponse,
  OpenRouterRequest,
  OpenRouterResponse,
  ResponseFormat,
} from "./openRouterService.types";

// Re-export types for easier consumption
export type {
  ChatCompletionOptions,
  FlashcardGenerationResponse,
  LLMResponse,
  ModelParams,
  ResponseFormat,
} from "./openRouterService.types";
export { createFlashcardResponseFormat } from "./openRouterService.types";

// =============================================================================
// OPENROUTER SERVICE
// =============================================================================

/**
 * Service for integrating with OpenRouter API
 *
 * Provides methods for generating flashcards using various LLM models
 * through the OpenRouter platform.
 */
export class OpenRouterService {
  /**
   * Default system prompt for flashcard generation
   */
  public static readonly DEFAULT_SYSTEM_PROMPT = `You are an expert educational content creator specializing in creating high-quality flashcards.

Your task is to analyze the provided text and generate effective flashcards that:
- Focus on key concepts, definitions, and important facts
- Use clear and concise language
- Create questions that test understanding, not just memorization
- Ensure answers are accurate and complete
- Avoid redundancy between flashcards
- Cover the material comprehensively

Generate between 5-15 flashcards depending on the content length and complexity.

Each flashcard must have:
- "front": The question or prompt (max 200 characters)
- "back": The answer or explanation (max 500 characters)`;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs = 60000; // 60 seconds

  /**
   * Creates a new OpenRouterService instance
   *
   * @param apiKey - OpenRouter API key
   * @param baseUrl - Base URL for OpenRouter API (defaults to production endpoint)
   */
  constructor(apiKey: string, baseUrl = "https://openrouter.ai/api/v1") {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new AuthenticationError("OpenRouter API key is required");
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Send a chat completion request to OpenRouter API
   *
   * @param options - Chat completion options
   * @returns LLM response with parsed content
   * @throws ValidationError if input options are invalid
   * @throws AuthenticationError if API key is invalid
   * @throws TimeoutError if request times out
   * @throws SchemaValidationError if response doesn't match expected schema
   * @throws APIError for other API errors
   */
  async chatCompletion<T = unknown>(options: ChatCompletionOptions): Promise<LLMResponse<T>> {
    // Validate input options
    const validationResult = chatCompletionOptionsSchema.safeParse(options);
    if (!validationResult.success) {
      const fields: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        fields[path] = err.message;
      });
      throw new ValidationError("Invalid chat completion options", fields);
    }

    // Build request payload
    const request = this.#buildRequest(options);

    // Send request with timeout
    const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        await this.#handleErrorResponse(response);
      }

      // Parse and validate response
      const data = (await response.json()) as OpenRouterResponse;
      const parsedResponse = openRouterResponseSchema.safeParse(data);

      if (!parsedResponse.success) {
        throw new SchemaValidationError("Invalid response format from OpenRouter API", data);
      }

      // Extract content from response
      const validatedData = parsedResponse.data;
      if (!validatedData.choices || validatedData.choices.length === 0) {
        throw new APIError("No completion choices returned from API");
      }

      const messageContent = validatedData.choices[0].message.content;

      // Parse JSON content
      let parsedContent: T;
      try {
        parsedContent = JSON.parse(messageContent) as T;
      } catch {
        throw new SchemaValidationError("Failed to parse response content as JSON", messageContent);
      }

      // Validate against response format schema if provided
      this.#validateSchema(parsedContent, options.responseFormat);

      return {
        content: parsedContent,
        model: validatedData.model,
        usage: validatedData.usage,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError(`Request timed out after ${timeoutMs}ms`);
      }

      // Re-throw known errors
      if (
        error instanceof AuthenticationError ||
        error instanceof ValidationError ||
        error instanceof SchemaValidationError ||
        error instanceof APIError ||
        error instanceof RateLimitError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw new APIError(
        `Unexpected error during API request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Build OpenRouter API request payload from options
   */
  #buildRequest(options: ChatCompletionOptions): OpenRouterRequest {
    const request: OpenRouterRequest = {
      model: options.model,
      messages: [
        {
          role: "system",
          content: options.system,
        },
        {
          role: "user",
          content: options.user,
        },
      ],
      response_format: options.responseFormat,
    };

    // Add optional parameters if provided
    if (options.parameters) {
      if (options.parameters.temperature !== undefined) {
        request.temperature = options.parameters.temperature;
      }
      if (options.parameters.max_tokens !== undefined) {
        request.max_tokens = options.parameters.max_tokens;
      }
      if (options.parameters.top_p !== undefined) {
        request.top_p = options.parameters.top_p;
      }
      if (options.parameters.frequency_penalty !== undefined) {
        request.frequency_penalty = options.parameters.frequency_penalty;
      }
      if (options.parameters.presence_penalty !== undefined) {
        request.presence_penalty = options.parameters.presence_penalty;
      }
    }

    return request;
  }

  /**
   * Validate response content against schema
   */
  #validateSchema<T>(content: T, responseFormat: ResponseFormat): void {
    if (!content || typeof content !== "object") {
      throw new SchemaValidationError("Response content is not an object", content);
    }

    const schema = responseFormat.json_schema.schema;
    const requiredFields = schema.required;

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in (content as object))) {
        throw new SchemaValidationError(`Missing required field: ${field}`, content);
      }
    }

    // Basic type validation for properties
    const contentObj = content as Record<string, unknown>;
    for (const key of Object.keys(contentObj)) {
      if (!(key in schema.properties)) {
        if (schema.additionalProperties === false) {
          throw new SchemaValidationError(`Unexpected field: ${key}`, content);
        }
      }
    }
  }

  /**
   * Handle error responses from OpenRouter API
   */
  async #handleErrorResponse(response: Response): Promise<never> {
    const statusCode = response.status;
    let errorBody: OpenRouterErrorResponse | undefined;

    try {
      errorBody = (await response.json()) as OpenRouterErrorResponse;
    } catch {
      // If we can't parse the error response, continue with generic error
    }

    const errorMessage = errorBody?.error?.message ?? `API request failed with status ${statusCode}`;

    // Handle specific status codes
    switch (statusCode) {
      case 401:
        throw new AuthenticationError(errorMessage);

      case 429: {
        // Extract retry-after header if present
        const retryAfter = response.headers.get("retry-after");
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
        throw new RateLimitError(errorMessage, retryAfterSeconds);
      }

      case 400:
        throw new ValidationError(errorMessage);

      case 403:
        throw new AuthenticationError(errorMessage);

      default:
        throw new APIError(errorMessage, statusCode, errorBody);
    }
  }
}
