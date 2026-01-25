import { describe, it, expect } from "vitest";
import {
  OpenRouterError,
  AuthenticationError,
  ValidationError,
  SchemaValidationError,
  APIError,
  TimeoutError,
  RateLimitError,
} from "./openRouterErrors";

// =============================================================================
// BASE ERROR CLASS TESTS
// =============================================================================

describe("OpenRouterError", () => {
  it("creates error with custom message", () => {
    const error = new OpenRouterError("Test error message");

    expect(error.message).toBe("Test error message");
    expect(error.name).toBe("OpenRouterError");
  });

  it("extends native Error class", () => {
    const error = new OpenRouterError("Test");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(OpenRouterError);
  });

  it("includes stack trace", () => {
    const error = new OpenRouterError("Test");

    expect(error.stack).toBeDefined();
  });
});

// =============================================================================
// AUTHENTICATION ERROR TESTS
// =============================================================================

describe("AuthenticationError", () => {
  it("creates error with default message", () => {
    const error = new AuthenticationError();

    expect(error.message).toBe("Invalid or missing OpenRouter API key");
    expect(error.name).toBe("AuthenticationError");
  });

  it("creates error with custom message", () => {
    const customMessage = "API key expired";
    const error = new AuthenticationError(customMessage);

    expect(error.message).toBe(customMessage);
  });

  it("extends OpenRouterError", () => {
    const error = new AuthenticationError();

    expect(error).toBeInstanceOf(OpenRouterError);
    expect(error).toBeInstanceOf(AuthenticationError);
  });

  it("can be caught as OpenRouterError", () => {
    try {
      throw new AuthenticationError("Test");
    } catch (error) {
      expect(error).toBeInstanceOf(OpenRouterError);
    }
  });
});

// =============================================================================
// VALIDATION ERROR TESTS
// =============================================================================

describe("ValidationError", () => {
  it("creates error with message only", () => {
    const error = new ValidationError("Invalid input");

    expect(error.message).toBe("Invalid input");
    expect(error.name).toBe("ValidationError");
    expect(error.fields).toBeUndefined();
  });

  it("creates error with field-level details", () => {
    const fields = {
      email: "Invalid email format",
      password: "Password too short",
    };
    const error = new ValidationError("Validation failed", fields);

    expect(error.message).toBe("Validation failed");
    expect(error.fields).toEqual(fields);
  });

  it("stores field errors as public readonly property", () => {
    const fields = { field1: "error1" };
    const error = new ValidationError("Test", fields);

    expect(error.fields).toBeDefined();
    expect(error.fields?.field1).toBe("error1");
  });

  it("extends OpenRouterError", () => {
    const error = new ValidationError("Test");

    expect(error).toBeInstanceOf(OpenRouterError);
    expect(error).toBeInstanceOf(ValidationError);
  });

  it("allows accessing nested field errors", () => {
    const fields = {
      "parameters.temperature": "Must be between 0 and 2",
      "parameters.top_p": "Must be between 0 and 1",
    };
    const error = new ValidationError("Invalid parameters", fields);

    expect(error.fields?.["parameters.temperature"]).toBe("Must be between 0 and 2");
    expect(error.fields?.["parameters.top_p"]).toBe("Must be between 0 and 1");
  });
});

// =============================================================================
// SCHEMA VALIDATION ERROR TESTS
// =============================================================================

describe("SchemaValidationError", () => {
  it("creates error with message only", () => {
    const error = new SchemaValidationError("Schema mismatch");

    expect(error.message).toBe("Schema mismatch");
    expect(error.name).toBe("SchemaValidationError");
    expect(error.responseData).toBeUndefined();
  });

  it("creates error with response data", () => {
    const responseData = { unexpected: "field" };
    const error = new SchemaValidationError("Missing required field", responseData);

    expect(error.message).toBe("Missing required field");
    expect(error.responseData).toEqual(responseData);
  });

  it("stores complex response data", () => {
    const responseData = {
      flashcards: [{ front: "Q", back: "A" }],
      extraField: "should not be here",
    };
    const error = new SchemaValidationError("Unexpected field", responseData);

    expect(error.responseData).toEqual(responseData);
  });

  it("extends OpenRouterError", () => {
    const error = new SchemaValidationError("Test");

    expect(error).toBeInstanceOf(OpenRouterError);
    expect(error).toBeInstanceOf(SchemaValidationError);
  });

  it("handles null and primitive response data", () => {
    const error1 = new SchemaValidationError("Null data", null);
    const error2 = new SchemaValidationError("String data", "invalid");
    const error3 = new SchemaValidationError("Number data", 123);

    expect(error1.responseData).toBeNull();
    expect(error2.responseData).toBe("invalid");
    expect(error3.responseData).toBe(123);
  });
});

// =============================================================================
// API ERROR TESTS
// =============================================================================

describe("APIError", () => {
  it("creates error with message only", () => {
    const error = new APIError("API request failed");

    expect(error.message).toBe("API request failed");
    expect(error.name).toBe("APIError");
    expect(error.statusCode).toBeUndefined();
    expect(error.responseBody).toBeUndefined();
  });

  it("creates error with status code", () => {
    const error = new APIError("Server error", 500);

    expect(error.message).toBe("Server error");
    expect(error.statusCode).toBe(500);
  });

  it("creates error with status code and response body", () => {
    const responseBody = { error: { type: "server_error", message: "Internal error" } };
    const error = new APIError("Server error", 500, responseBody);

    expect(error.statusCode).toBe(500);
    expect(error.responseBody).toEqual(responseBody);
  });

  it("extends OpenRouterError", () => {
    const error = new APIError("Test");

    expect(error).toBeInstanceOf(OpenRouterError);
    expect(error).toBeInstanceOf(APIError);
  });

  it("handles common HTTP status codes", () => {
    const error400 = new APIError("Bad request", 400);
    const error404 = new APIError("Not found", 404);
    const error500 = new APIError("Server error", 500);
    const error502 = new APIError("Bad gateway", 502);
    const error503 = new APIError("Service unavailable", 503);

    expect(error400.statusCode).toBe(400);
    expect(error404.statusCode).toBe(404);
    expect(error500.statusCode).toBe(500);
    expect(error502.statusCode).toBe(502);
    expect(error503.statusCode).toBe(503);
  });
});

// =============================================================================
// TIMEOUT ERROR TESTS
// =============================================================================

describe("TimeoutError", () => {
  it("creates error with default message", () => {
    const error = new TimeoutError();

    expect(error.message).toBe("Request timed out");
    expect(error.name).toBe("TimeoutError");
  });

  it("creates error with custom message", () => {
    const customMessage = "Request timed out after 30000ms";
    const error = new TimeoutError(customMessage);

    expect(error.message).toBe(customMessage);
  });

  it("extends OpenRouterError", () => {
    const error = new TimeoutError();

    expect(error).toBeInstanceOf(OpenRouterError);
    expect(error).toBeInstanceOf(TimeoutError);
  });

  it("differentiates from other error types", () => {
    const error = new TimeoutError();

    expect(error).not.toBeInstanceOf(AuthenticationError);
    expect(error).not.toBeInstanceOf(ValidationError);
    expect(error).not.toBeInstanceOf(APIError);
  });
});

// =============================================================================
// RATE LIMIT ERROR TESTS
// =============================================================================

describe("RateLimitError", () => {
  it("creates error with default message", () => {
    const error = new RateLimitError();

    expect(error.message).toBe("Rate limit exceeded");
    expect(error.name).toBe("RateLimitError");
    expect(error.retryAfter).toBeUndefined();
  });

  it("creates error with custom message", () => {
    const customMessage = "Too many requests from this IP";
    const error = new RateLimitError(customMessage);

    expect(error.message).toBe(customMessage);
  });

  it("creates error with retry-after value", () => {
    const error = new RateLimitError("Rate limited", 60);

    expect(error.message).toBe("Rate limited");
    expect(error.retryAfter).toBe(60);
  });

  it("stores retry-after as public readonly property", () => {
    const error = new RateLimitError("Rate limited", 120);

    expect(error.retryAfter).toBe(120);
  });

  it("extends OpenRouterError", () => {
    const error = new RateLimitError();

    expect(error).toBeInstanceOf(OpenRouterError);
    expect(error).toBeInstanceOf(RateLimitError);
  });

  it("handles various retry-after durations", () => {
    const error1 = new RateLimitError("Short wait", 5);
    const error2 = new RateLimitError("Medium wait", 60);
    const error3 = new RateLimitError("Long wait", 3600);

    expect(error1.retryAfter).toBe(5);
    expect(error2.retryAfter).toBe(60);
    expect(error3.retryAfter).toBe(3600);
  });

  it("allows undefined retry-after", () => {
    const error = new RateLimitError("Rate limited", undefined);

    expect(error.retryAfter).toBeUndefined();
  });
});

// =============================================================================
// ERROR HIERARCHY TESTS
// =============================================================================

describe("Error Hierarchy", () => {
  it("all custom errors extend OpenRouterError", () => {
    const errors = [
      new AuthenticationError(),
      new ValidationError("Test"),
      new SchemaValidationError("Test"),
      new APIError("Test"),
      new TimeoutError(),
      new RateLimitError(),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(OpenRouterError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  it("can differentiate between error types using instanceof", () => {
    const authError = new AuthenticationError();
    const validationError = new ValidationError("Test");
    const timeoutError = new TimeoutError();

    expect(authError).toBeInstanceOf(AuthenticationError);
    expect(authError).not.toBeInstanceOf(ValidationError);
    expect(authError).not.toBeInstanceOf(TimeoutError);

    expect(validationError).toBeInstanceOf(ValidationError);
    expect(validationError).not.toBeInstanceOf(AuthenticationError);

    expect(timeoutError).toBeInstanceOf(TimeoutError);
    expect(timeoutError).not.toBeInstanceOf(ValidationError);
  });

  it("can catch specific error type", () => {
    const throwAuthError = () => {
      throw new AuthenticationError("Invalid key");
    };

    try {
      throwAuthError();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        expect(error.message).toBe("Invalid key");
      } else {
        expect.fail("Should have caught AuthenticationError");
      }
    }
  });

  it("can catch all OpenRouter errors with base class", () => {
    const errors = [
      new AuthenticationError(),
      new ValidationError("Test"),
      new TimeoutError(),
      new RateLimitError(),
    ];

    errors.forEach((error) => {
      try {
        throw error;
      } catch (caught) {
        expect(caught).toBeInstanceOf(OpenRouterError);
      }
    });
  });
});
