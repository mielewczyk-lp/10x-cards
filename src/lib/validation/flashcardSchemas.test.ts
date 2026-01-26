import { describe, it, expect } from "vitest";
import { CreateFlashcardSchema, CreateFlashcardsSchema, StartPracticeSchema } from "./flashcardSchemas";

describe("CreateFlashcardSchema", () => {
  describe("front field validation", () => {
    it("accepts valid front text within length limits", () => {
      const validData = {
        front: "What is React?",
        back: "A JavaScript library",
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("trims whitespace from front text", () => {
      const data = {
        front: "  Trimmed text  ",
        back: "Answer",
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      if (result.success) {
        expect(result.data.front).toBe("Trimmed text");
      } else {
        throw new Error("Expected validation to succeed");
      }
    });

    it("rejects empty front after trimming", () => {
      const data = {
        front: "   ",
        back: "Answer",
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("FRONT_REQUIRED");
      }
    });

    it("rejects front text exceeding 200 characters", () => {
      const data = {
        front: "a".repeat(201),
        back: "Answer",
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("FRONT_TOO_LONG");
      }
    });

    it("accepts front text at exactly 200 characters", () => {
      const data = {
        front: "a".repeat(200),
        back: "Answer",
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("back field validation", () => {
    it("rejects empty back after trimming", () => {
      const data = {
        front: "Question",
        back: "   ",
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("BACK_REQUIRED");
      }
    });

    it("rejects back text exceeding 500 characters", () => {
      const data = {
        front: "Question",
        back: "a".repeat(501),
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("BACK_TOO_LONG");
      }
    });

    it("accepts back text at exactly 500 characters", () => {
      const data = {
        front: "Question",
        back: "a".repeat(500),
        sourceType: "manual" as const,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("sourceType field validation", () => {
    it("accepts all valid source types", () => {
      const types = ["ai-full", "ai-edited", "manual"] as const;

      types.forEach((sourceType) => {
        const data = {
          front: "Question",
          back: "Answer",
          sourceType,
        };
        const result = CreateFlashcardSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid source type", () => {
      const data = {
        front: "Question",
        back: "Answer",
        sourceType: "invalid-type",
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("generationSourceId field validation", () => {
    it("accepts valid UUID", () => {
      const data = {
        front: "Question",
        back: "Answer",
        sourceType: "ai-full" as const,
        generationSourceId: "550e8400-e29b-41d4-a716-446655440000",
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts null as generationSourceId", () => {
      const data = {
        front: "Question",
        back: "Answer",
        sourceType: "manual" as const,
        generationSourceId: null,
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("rejects invalid UUID format", () => {
      const data = {
        front: "Question",
        back: "Answer",
        sourceType: "ai-full" as const,
        generationSourceId: "not-a-uuid",
      };

      const result = CreateFlashcardSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GENERATION_SOURCE_ID_INVALID");
      }
    });
  });
});

describe("CreateFlashcardsSchema", () => {
  it("accepts valid array of flashcards", () => {
    const data = [
      {
        front: "Question 1",
        back: "Answer 1",
        sourceType: "manual" as const,
      },
      {
        front: "Question 2",
        back: "Answer 2",
        sourceType: "ai-full" as const,
      },
    ];

    const result = CreateFlashcardsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepts array with 50 flashcards (maximum)", () => {
    const data = Array(50).fill({
      front: "Question",
      back: "Answer",
      sourceType: "manual" as const,
    });

    const result = CreateFlashcardsSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const data: unknown[] = [];

    const result = CreateFlashcardsSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("AT_LEAST_ONE_FLASHCARD_REQUIRED");
    }
  });

  it("rejects array with more than 50 flashcards", () => {
    const data = Array(51).fill({
      front: "Question",
      back: "Answer",
      sourceType: "manual" as const,
    });

    const result = CreateFlashcardsSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("TOO_MANY_FLASHCARDS");
    }
  });

  it("rejects array with invalid flashcard data", () => {
    const data = [
      {
        front: "Question",
        back: "Answer",
        sourceType: "manual" as const,
      },
      {
        front: "", // Invalid: empty front
        back: "Answer",
        sourceType: "manual" as const,
      },
    ];

    const result = CreateFlashcardsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe("StartPracticeSchema", () => {
  it("accepts limit of 10", () => {
    const data = { limit: 10 };

    const result = StartPracticeSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("accepts limit of 20", () => {
    const data = { limit: 20 };

    const result = StartPracticeSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });

  it("accepts limit of 50", () => {
    const data = { limit: 50 };

    const result = StartPracticeSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it("rejects limit not in allowed values (10, 20, 50)", () => {
    const invalidLimits = [5, 15, 30, 100];

    invalidLimits.forEach((limit) => {
      const result = StartPracticeSchema.safeParse({ limit });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("LIMIT_MUST_BE_10_20_OR_50");
      }
    });
  });

  it("rejects missing limit field", () => {
    const data = {};

    const result = StartPracticeSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("LIMIT_REQUIRED");
    }
  });

  it("rejects non-integer limit", () => {
    const data = { limit: 10.5 };

    const result = StartPracticeSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("LIMIT_MUST_BE_INTEGER");
    }
  });

  it("rejects non-number limit", () => {
    const data = { limit: "10" };

    const result = StartPracticeSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("LIMIT_INVALID");
    }
  });
});
