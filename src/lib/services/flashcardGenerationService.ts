import type { FlashcardCandidateDto } from "../../types";
import { OpenRouterService, createFlashcardResponseFormat } from "./openRouterService";
import type { FlashcardGenerationResponse } from "./openRouterService.types";

/**
 * Configuration for flashcard generation
 */
export interface FlashcardGenerationConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Default configuration for flashcard generation
 */
const DEFAULT_CONFIG: FlashcardGenerationConfig = {
  model: "",
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * Service responsible for generating flashcard candidates using an LLM
 */
export class FlashcardGenerationService {
  private openRouterService: OpenRouterService;
  private config: FlashcardGenerationConfig;

  /**
   * Creates a new FlashcardGenerationService instance
   *
   * @param apiKey - OpenRouter API key
   * @param config - Optional configuration for generation
   */
  constructor(apiKey: string, config: Partial<FlashcardGenerationConfig> = {}) {
    this.openRouterService = new OpenRouterService(apiKey);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate flashcard candidates from input text
   *
   * @param inputText - The text to generate flashcards from (1000-10000 chars)
   * @returns Array of flashcard candidates with front and back
   * @throws Error if generation fails
   */
  async generate(inputText: string): Promise<{
    candidates: FlashcardCandidateDto[];
    modelName: string;
  }> {
    try {
      const response = await this.openRouterService.chatCompletion<FlashcardGenerationResponse>({
        system: OpenRouterService.DEFAULT_SYSTEM_PROMPT,
        user: `Generate flashcards from the following text:\n\n${inputText}`,
        model: this.config.model,
        responseFormat: createFlashcardResponseFormat(),
        parameters: {
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        },
      });

      return {
        candidates: response.content.flashcards,
        modelName: response.model,
      };
    } catch (error) {
      throw new Error(`Failed to generate flashcards: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get the current model name being used
   */
  getModelName(): string {
    return this.config.model;
  }
}

/**
 * Create a singleton instance of the service
 * Note: This will throw if OPENROUTER_API_KEY is not set
 *
 * @param apiKey - OpenRouter API key
 * @param config - Optional configuration for generation
 * @returns FlashcardGenerationService instance
 */
export function createFlashcardGenerationService(
  apiKey: string,
  config?: Partial<FlashcardGenerationConfig>
): FlashcardGenerationService {
  return new FlashcardGenerationService(apiKey, config);
}
