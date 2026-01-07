/**
 * Base error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Error thrown when API key is missing or invalid
 */
export class AuthenticationError extends OpenRouterError {
  constructor(message = "Invalid or missing OpenRouter API key") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Error thrown when input validation fails (request payload)
 */
export class ValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when response doesn't match expected schema
 */
export class SchemaValidationError extends OpenRouterError {
  constructor(
    message: string,
    public readonly responseData?: unknown
  ) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

/**
 * Error thrown for unclassified API errors (4xx/5xx)
 */
export class APIError extends OpenRouterError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly responseBody?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Error thrown when request exceeds timeout limit
 */
export class TimeoutError extends OpenRouterError {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends OpenRouterError {
  constructor(
    message = "Rate limit exceeded",
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}
