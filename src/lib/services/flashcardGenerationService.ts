import type { FlashcardCandidateDto } from "../../types";

/**
 * Error thrown when the AI service is unavailable or returns an error
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 502
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Service responsible for generating flashcard candidates using an LLM
 * Currently uses a mock implementation - will be replaced with real AI service later
 */
export class FlashcardGenerationService {
  private modelName = "mock-model-v1";

  /**
   * Generate flashcard candidates from input text
   * MOCK IMPLEMENTATION - returns sample flashcards for testing
   *
   * @param inputText - The text to generate flashcards from (1000-10000 chars)
   * @returns Array of flashcard candidates with front and back
   * @throws AIServiceError if generation fails
   */
  async generate(inputText: string): Promise<{
    candidates: FlashcardCandidateDto[];
    modelName: string;
  }> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // Mock: Generate sample flashcards based on input text length
      const textLength = inputText.length;
      const numberOfCards = Math.min(Math.max(Math.floor(textLength / 500), 5), 15);

      const candidates: FlashcardCandidateDto[] = [];

      for (let i = 1; i <= numberOfCards; i++) {
        candidates.push({
          front: `Sample question ${i} from the provided text`,
          back: `Sample answer ${i} explaining the concept in detail`,
        });
      }

      return {
        candidates,
        modelName: this.modelName,
      };
    } catch (error) {
      throw new AIServiceError(
        `Failed to generate flashcards: ${error instanceof Error ? error.message : "Unknown error"}`,
        502
      );
    }
  }

  /**
   * Get the current model name being used
   */
  getModelName(): string {
    return this.modelName;
  }
}

/**
 * Default singleton instance of the service
 */
export const flashcardGenerationService = new FlashcardGenerationService();
