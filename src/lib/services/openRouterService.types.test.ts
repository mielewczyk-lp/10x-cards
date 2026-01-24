import { describe, it, expect } from "vitest";
import { createFlashcardResponseFormat } from "./openRouterService.types";

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe("createFlashcardResponseFormat", () => {
  it("creates valid ResponseFormat structure", () => {
    const format = createFlashcardResponseFormat();

    expect(format).toBeDefined();
    expect(format.type).toBe("json_schema");
    expect(format.json_schema).toBeDefined();
  });

  it("sets strict mode to true", () => {
    const format = createFlashcardResponseFormat();

    expect(format.json_schema.strict).toBe(true);
  });

  it("has correct schema name", () => {
    const format = createFlashcardResponseFormat();

    expect(format.json_schema.name).toBe("FlashcardSet");
  });

  it("defines flashcards as required field", () => {
    const format = createFlashcardResponseFormat();

    expect(format.json_schema.schema.required).toContain("flashcards");
  });

  it("sets additionalProperties to false for strict validation", () => {
    const format = createFlashcardResponseFormat();

    expect(format.json_schema.schema.additionalProperties).toBe(false);
  });

  it("defines flashcards property as array", () => {
    const format = createFlashcardResponseFormat();

    expect(format.json_schema.schema.properties.flashcards).toBeDefined();
    expect(format.json_schema.schema.properties.flashcards).toHaveProperty("type", "array");
  });

  it("defines flashcard items with front and back properties", () => {
    const format = createFlashcardResponseFormat();

    const flashcardsProperty = format.json_schema.schema.properties.flashcards as unknown as Record<string, unknown>;
    const items = flashcardsProperty.items as Record<string, unknown>;

    expect(items.type).toBe("object");
    expect(items.properties).toHaveProperty("front");
    expect(items.properties).toHaveProperty("back");
  });

  it("requires front and back fields in flashcard items", () => {
    const format = createFlashcardResponseFormat();

    const flashcardsProperty = format.json_schema.schema.properties.flashcards as unknown as Record<string, unknown>;
    const items = flashcardsProperty.items as Record<string, unknown>;

    expect(items.required).toEqual(["front", "back"]);
  });

  it("disallows additional properties in flashcard items", () => {
    const format = createFlashcardResponseFormat();

    const flashcardsProperty = format.json_schema.schema.properties.flashcards as unknown as Record<string, unknown>;
    const items = flashcardsProperty.items as Record<string, unknown>;

    expect(items.additionalProperties).toBe(false);
  });

  it("creates new object instance on each call", () => {
    const format1 = createFlashcardResponseFormat();
    const format2 = createFlashcardResponseFormat();

    expect(format1).not.toBe(format2);
    expect(format1).toEqual(format2);
  });

  it("schema structure is compatible with OpenAI structured outputs", () => {
    const format = createFlashcardResponseFormat();

    // OpenAI structured outputs require these fields
    expect(format.type).toBe("json_schema");
    expect(format.json_schema.name).toBeDefined();
    expect(format.json_schema.strict).toBeDefined();
    expect(format.json_schema.schema.type).toBe("object");
    expect(format.json_schema.schema.properties).toBeDefined();
    expect(format.json_schema.schema.required).toBeDefined();
  });

  it("validates against typical flashcard response", () => {
    const format = createFlashcardResponseFormat();
    const schema = format.json_schema.schema;

    // Simulated valid response
    const validResponse = {
      flashcards: [
        { front: "Question 1", back: "Answer 1" },
        { front: "Question 2", back: "Answer 2" },
      ],
    };

    // Check required fields
    expect(Object.keys(validResponse)).toEqual(schema.required);

    // Check flashcards array
    expect(Array.isArray(validResponse.flashcards)).toBe(true);

    // Check each flashcard item
    validResponse.flashcards.forEach((card) => {
      const flashcardsProperty = schema.properties.flashcards as unknown as Record<string, unknown>;
      const items = flashcardsProperty.items as Record<string, unknown>;
      const requiredFields = items.required as string[];

      requiredFields.forEach((field) => {
        expect(card).toHaveProperty(field);
      });
    });
  });
});
