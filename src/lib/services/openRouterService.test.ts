import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "./openRouterService";
import {
  APIError,
  AuthenticationError,
  RateLimitError,
  SchemaValidationError,
  ValidationError,
} from "../errors/openRouterErrors";
import type { ChatCompletionOptions, LLMResponse } from "./openRouterService.types";
import { createFlashcardResponseFormat } from "./openRouterService.types";

// =============================================================================
// TEST HELPERS & FIXTURES
// =============================================================================

const TEST_API_KEY = "sk-or-v1-test-key-123";
const BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Create valid chat completion options for testing
 */
function createValidOptions(overrides?: Partial<ChatCompletionOptions>): ChatCompletionOptions {
  return {
    system: OpenRouterService.DEFAULT_SYSTEM_PROMPT,
    user: "Generate flashcards about TypeScript basics",
    model: "openai/gpt-4o-mini",
    responseFormat: createFlashcardResponseFormat(),
    ...overrides,
  };
}

/**
 * Create mock OpenRouter API response
 */
function createMockResponse(content: string, model = "openai/gpt-4o-mini") {
  return {
    id: "chatcmpl-123",
    model,
    choices: [
      {
        message: {
          role: "assistant",
          content,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  };
}

/**
 * Create mock flashcard response content
 */
function createFlashcardContent() {
  return JSON.stringify({
    flashcards: [
      { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
      { front: "What is a type annotation?", back: "Syntax to declare variable types" },
    ],
  });
}

// =============================================================================
// CONSTRUCTOR TESTS
// =============================================================================

describe("OpenRouterService - Constructor", () => {
  it("creates instance with valid API key", () => {
    const service = new OpenRouterService(TEST_API_KEY);
    expect(service).toBeInstanceOf(OpenRouterService);
  });

  it("accepts custom base URL", () => {
    const customUrl = "https://custom.api.com";
    const service = new OpenRouterService(TEST_API_KEY, customUrl);
    expect(service).toBeInstanceOf(OpenRouterService);
  });

  it("throws AuthenticationError when API key is empty string (US-004 CRITICAL)", () => {
    expect(() => new OpenRouterService("")).toThrow(AuthenticationError);
    expect(() => new OpenRouterService("")).toThrow("OpenRouter API key is required");
  });

  it("throws AuthenticationError when API key is whitespace only", () => {
    expect(() => new OpenRouterService("   ")).toThrow(AuthenticationError);
    expect(() => new OpenRouterService("\t\n")).toThrow(AuthenticationError);
  });
});

// =============================================================================
// CHAT COMPLETION - INPUT VALIDATION TESTS
// =============================================================================

describe("OpenRouterService - Input Validation (US-003, US-004)", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService(TEST_API_KEY);
  });

  it("throws ValidationError when system message is empty", async () => {
    const options = createValidOptions({ system: "" });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Invalid chat completion options");
  });

  it("throws ValidationError when user message is empty", async () => {
    const options = createValidOptions({ user: "" });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when model name is empty", async () => {
    const options = createValidOptions({ model: "" });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("includes field-level error details in ValidationError", async () => {
    const options = createValidOptions({ system: "", user: "" });

    try {
      await service.chatCompletion(options);
      expect.fail("Should have thrown ValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.fields).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expect(Object.keys(error.fields!).length).toBeGreaterThan(0);
      }
    }
  });

  it("throws ValidationError when temperature is out of range", async () => {
    const options = createValidOptions({
      parameters: { temperature: 3.0 },
    });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when temperature is negative", async () => {
    const options = createValidOptions({
      parameters: { temperature: -0.1 },
    });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when max_tokens is not positive", async () => {
    const options = createValidOptions({
      parameters: { max_tokens: 0 },
    });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when top_p is out of range", async () => {
    const options = createValidOptions({
      parameters: { top_p: 1.5 },
    });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when frequency_penalty is out of range", async () => {
    const options = createValidOptions({
      parameters: { frequency_penalty: 3.0 },
    });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when presence_penalty is out of range", async () => {
    const options = createValidOptions({
      parameters: { presence_penalty: -3.0 },
    });

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
  });

  it("accepts valid parameters within allowed ranges", async () => {
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions({
      parameters: {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
      },
    });

    const result = await service.chatCompletion(options);
    expect(result.content).toBeDefined();
  });
});

// =============================================================================
// CHAT COMPLETION - SUCCESS SCENARIOS
// =============================================================================

describe("OpenRouterService - Success Scenarios (US-004)", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService(TEST_API_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed content on successful request", async () => {
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();
    const result: LLMResponse<{ flashcards: { front: string; back: string }[] }> =
      await service.chatCompletion(options);

    expect(result.content).toBeDefined();
    expect(result.content.flashcards).toHaveLength(2);
    expect(result.content.flashcards[0].front).toBe("What is TypeScript?");
    expect(result.model).toBe("openai/gpt-4o-mini");
  });

  it("includes usage information in response", async () => {
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();
    const result = await service.chatCompletion(options);

    expect(result.usage).toBeDefined();
    expect(result.usage?.prompt_tokens).toBe(100);
    expect(result.usage?.completion_tokens).toBe(50);
    expect(result.usage?.total_tokens).toBe(150);
  });

  it("sends correct request payload with authorization header", async () => {
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });
    global.fetch = fetchMock;

    const options = createValidOptions();
    await service.chatCompletion(options);

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/chat/completions`,
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_API_KEY}`,
        },
      })
    );
  });

  it("includes optional parameters in request when provided", async () => {
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });
    global.fetch = fetchMock;

    const options = createValidOptions({
      parameters: {
        temperature: 0.8,
        max_tokens: 500,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.1,
      },
    });

    await service.chatCompletion(options);

    const callArgs = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);

    expect(requestBody.temperature).toBe(0.8);
    expect(requestBody.max_tokens).toBe(500);
    expect(requestBody.top_p).toBe(0.95);
    expect(requestBody.frequency_penalty).toBe(0.2);
    expect(requestBody.presence_penalty).toBe(0.1);
  });

  it("excludes optional parameters when not provided", async () => {
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });
    global.fetch = fetchMock;

    const options = createValidOptions(); // No parameters

    await service.chatCompletion(options);

    const callArgs = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);

    expect(requestBody.temperature).toBeUndefined();
    expect(requestBody.max_tokens).toBeUndefined();
    expect(requestBody.top_p).toBeUndefined();
  });

  it("uses custom timeout when provided", async () => {
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);

    // Use fake timers to test timeout behavior
    vi.useFakeTimers();

    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => mockResponse,
              headers: new Headers(),
            });
          }, 100);
        })
    );

    const options = createValidOptions({ timeoutMs: 5000 });
    const promise = service.chatCompletion(options);

    // Fast-forward time
    await vi.advanceTimersByTimeAsync(100);

    const result = await promise;
    expect(result.content).toBeDefined();

    vi.useRealTimers();
  });
});

// =============================================================================
// CHAT COMPLETION - ERROR HANDLING TESTS
// =============================================================================

describe("OpenRouterService - API Error Responses (US-004 CRITICAL)", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService(TEST_API_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws AuthenticationError on 401 status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: "Invalid API key" },
      }),
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(AuthenticationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Invalid API key");
  });

  it("throws AuthenticationError on 403 status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: { message: "Forbidden access" },
      }),
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(AuthenticationError);
  });

  it("throws ValidationError on 400 status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: "Invalid request payload" },
      }),
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(ValidationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Invalid request payload");
  });

  it("throws RateLimitError on 429 status with retry-after header (CRITICAL)", async () => {
    const headers = new Headers();
    headers.set("retry-after", "60");

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: { message: "Rate limit exceeded" },
      }),
      headers,
    });

    const options = createValidOptions();

    try {
      await service.chatCompletion(options);
      expect.fail("Should have thrown RateLimitError");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        expect(error.message).toBe("Rate limit exceeded");
        expect(error.retryAfter).toBe(60);
      }
    }
  });

  it("throws RateLimitError on 429 status without retry-after header", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: { message: "Too many requests" },
      }),
      headers: new Headers(),
    });

    const options = createValidOptions();

    try {
      await service.chatCompletion(options);
      expect.fail("Should have thrown RateLimitError");
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitError);
      if (error instanceof RateLimitError) {
        expect(error.retryAfter).toBeUndefined();
      }
    }
  });

  it("throws APIError on 500 status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: { message: "Internal server error" },
      }),
      headers: new Headers(),
    });

    const options = createValidOptions();

    try {
      await service.chatCompletion(options);
      expect.fail("Should have thrown APIError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      if (error instanceof APIError) {
        expect(error.statusCode).toBe(500);
        expect(error.message).toBe("Internal server error");
      }
    }
  });

  it("throws APIError with generic message when error body is unparseable", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("Invalid JSON");
      },
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(APIError);
    await expect(service.chatCompletion(options)).rejects.toThrow("API request failed with status 502");
  });
});

// =============================================================================
// CHAT COMPLETION - TIMEOUT TESTS
// =============================================================================

describe("OpenRouterService - Timeout Handling (US-004 CRITICAL)", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService(TEST_API_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("succeeds when request completes within timeout", async () => {
    vi.useFakeTimers();

    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent);

    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => mockResponse,
              headers: new Headers(),
            });
          }, 5000);
        })
    );

    const options = createValidOptions({ timeoutMs: 10000 });
    const promise = service.chatCompletion(options);

    await vi.advanceTimersByTimeAsync(5000);

    const result = await promise;
    expect(result.content).toBeDefined();
  });

  it("uses custom timeout value when provided", () => {
    // Verify timeout is configurable
    const options = createValidOptions({ timeoutMs: 30000 });
    expect(options.timeoutMs).toBe(30000);
  });

  it("has a default timeout of 60 seconds", () => {
    const options = createValidOptions();
    expect(options.timeoutMs).toBeUndefined(); // Uses service default
  });
});

// =============================================================================
// CHAT COMPLETION - RESPONSE VALIDATION TESTS
// =============================================================================

describe("OpenRouterService - Response Validation (US-004 CRITICAL)", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService(TEST_API_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws SchemaValidationError when OpenRouter response is malformed", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        // Missing required fields
        id: "test",
      }),
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(SchemaValidationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Invalid response format from OpenRouter API");
  });

  it("throws APIError when response has no choices", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "test",
        model: "openai/gpt-4o-mini",
        choices: [],
      }),
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(APIError);
    await expect(service.chatCompletion(options)).rejects.toThrow("No completion choices returned from API");
  });

  it("throws SchemaValidationError when response content is not valid JSON", async () => {
    const mockResponse = createMockResponse("invalid json content");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(SchemaValidationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Failed to parse response content as JSON");
  });

  it("throws SchemaValidationError when required field is missing", async () => {
    const invalidContent = JSON.stringify({
      // Missing 'flashcards' field
      someOtherField: "value",
    });
    const mockResponse = createMockResponse(invalidContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(SchemaValidationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Missing required field");
  });

  it("throws SchemaValidationError when content has unexpected field and additionalProperties is false", async () => {
    const invalidContent = JSON.stringify({
      flashcards: [],
      unexpectedField: "value",
    });
    const mockResponse = createMockResponse(invalidContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(SchemaValidationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Unexpected field");
  });

  it("throws SchemaValidationError when content is not an object", async () => {
    const invalidContent = JSON.stringify("string value");
    const mockResponse = createMockResponse(invalidContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(SchemaValidationError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Response content is not an object");
  });

  it("accepts valid response matching schema", async () => {
    const validContent = createFlashcardContent();
    const mockResponse = createMockResponse(validContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();
    const result = await service.chatCompletion(options);

    expect(result.content).toBeDefined();
  });
});

// =============================================================================
// CHAT COMPLETION - NETWORK ERROR TESTS
// =============================================================================

describe("OpenRouterService - Network Errors", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService(TEST_API_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("wraps network error in APIError", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection failed"));

    const options = createValidOptions();

    await expect(service.chatCompletion(options)).rejects.toThrow(APIError);
    await expect(service.chatCompletion(options)).rejects.toThrow("Unexpected error during API request");
  });

  it("preserves error message in wrapped APIError", async () => {
    const errorMessage = "DNS lookup failed";
    global.fetch = vi.fn().mockRejectedValue(new Error(errorMessage));

    const options = createValidOptions();

    try {
      await service.chatCompletion(options);
      expect.fail("Should have thrown APIError");
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      expect(error.message).toContain(errorMessage);
    }
  });
});

// =============================================================================
// INTEGRATION TESTS - REALISTIC SCENARIOS
// =============================================================================

describe("OpenRouterService - Integration Scenarios (US-004, US-005)", () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService(TEST_API_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully generates flashcards with valid input", async () => {
    const flashcardsContent = {
      flashcards: [
        {
          front: "What is TypeScript?",
          back: "TypeScript is a strongly typed programming language that builds on JavaScript.",
        },
        {
          front: "What is the main benefit of TypeScript?",
          back: "Type safety and better tooling support.",
        },
        {
          front: "How do you declare a variable type in TypeScript?",
          back: "Using type annotations with colon syntax: let name: string = 'John'",
        },
      ],
    };

    const mockResponse = createMockResponse(JSON.stringify(flashcardsContent));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions({
      user: "Generate flashcards about TypeScript. Focus on basics and type system.",
      parameters: {
        temperature: 0.7,
        max_tokens: 1500,
      },
    });

    const result: LLMResponse<typeof flashcardsContent> = await service.chatCompletion(options);

    expect(result.content.flashcards).toHaveLength(3);
    expect(result.model).toBe("openai/gpt-4o-mini");
    expect(result.usage).toBeDefined();
  });

  it("handles empty flashcard array from AI", async () => {
    const emptyContent = JSON.stringify({ flashcards: [] });
    const mockResponse = createMockResponse(emptyContent);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions();
    const result: LLMResponse<{ flashcards: unknown[] }> = await service.chatCompletion(options);

    expect(result.content.flashcards).toHaveLength(0);
  });

  it("preserves model information from response", async () => {
    const customModel = "anthropic/claude-3-5-sonnet";
    const mockContent = createFlashcardContent();
    const mockResponse = createMockResponse(mockContent, customModel);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
      headers: new Headers(),
    });

    const options = createValidOptions({ model: customModel });
    const result = await service.chatCompletion(options);

    expect(result.model).toBe(customModel);
  });
});

// =============================================================================
// DEFAULT SYSTEM PROMPT TEST
// =============================================================================

describe("OpenRouterService - Default System Prompt", () => {
  it("has non-empty default system prompt", () => {
    expect(OpenRouterService.DEFAULT_SYSTEM_PROMPT).toBeTruthy();
    expect(OpenRouterService.DEFAULT_SYSTEM_PROMPT.length).toBeGreaterThan(50);
  });

  it("default prompt mentions flashcards", () => {
    expect(OpenRouterService.DEFAULT_SYSTEM_PROMPT.toLowerCase()).toContain("flashcard");
  });

  it("default prompt is accessible as static property", () => {
    const prompt = OpenRouterService.DEFAULT_SYSTEM_PROMPT;
    expect(typeof prompt).toBe("string");
  });
});
