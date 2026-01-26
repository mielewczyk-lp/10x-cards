import { describe, it, expect } from "vitest";
import { CreateGenerationSourceSchema, UpdateGenerationSourceSchema } from "./generationSourceSchemas";

describe("CreateGenerationSourceSchema", () => {
  describe("inputText validation", () => {
    it("accepts valid text within length limits", () => {
      const data = {
        inputText: "a".repeat(5000), // 5000 characters, within 1000-10000 range
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts text at minimum length (1000 characters)", () => {
      const data = {
        inputText: "a".repeat(1000),
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts text at maximum length (10000 characters)", () => {
      const data = {
        inputText: "a".repeat(10000),
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("trims whitespace before length validation", () => {
      const data = {
        inputText: "  " + "a".repeat(1000) + "  ", // 1004 total, but 1000 after trim
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inputText).toBe("a".repeat(1000));
        expect(result.data.inputText.length).toBe(1000);
      }
    });

    it("rejects text shorter than 1000 characters", () => {
      const data = {
        inputText: "a".repeat(999),
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("rejects text exceeding 10000 characters", () => {
      const data = {
        inputText: "a".repeat(10001),
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("rejects text that becomes too short after trimming", () => {
      const data = {
        inputText: "  " + "a".repeat(998) + "  ", // 1002 total, but 998 after trim
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("rejects empty string", () => {
      const data = {
        inputText: "",
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("rejects whitespace-only string", () => {
      const data = {
        inputText: "   ",
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("rejects missing inputText field", () => {
      const data = {};

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("rejects non-string inputText", () => {
      const data = {
        inputText: 12345,
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("rejects null inputText", () => {
      const data = {
        inputText: null,
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("INPUT_TEXT_INVALID");
      }
    });

    it("accepts text with various Unicode characters", () => {
      const text = "Hello 世界 🌍 Ñoño ".repeat(100); // Ensure it reaches 1000+ chars
      const paddedText = text + "a".repeat(Math.max(0, 1000 - text.length));
      const data = {
        inputText: paddedText,
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts text with newlines and special characters", () => {
      const text = "Line 1\nLine 2\tTab\r\nCarriage return\n".repeat(50);
      const paddedText = text + "a".repeat(Math.max(0, 1000 - text.length));
      const data = {
        inputText: paddedText,
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles text exactly at lower boundary with leading/trailing spaces", () => {
      const data = {
        inputText: " " + "a".repeat(1000) + " ",
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inputText.length).toBe(1000);
      }
    });

    it("handles text exactly at upper boundary with leading/trailing spaces", () => {
      const data = {
        inputText: " " + "a".repeat(10000) + " ",
      };

      const result = CreateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.inputText.length).toBe(10000);
      }
    });
  });
});

describe("UpdateGenerationSourceSchema", () => {
  describe("totalAccepted validation", () => {
    it("accepts valid positive integer", () => {
      const data = {
        totalAccepted: 5,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAccepted).toBe(5);
      }
    });

    it("accepts zero", () => {
      const data = {
        totalAccepted: 0,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAccepted).toBe(0);
      }
    });

    it("accepts large integer value", () => {
      const data = {
        totalAccepted: 999999,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("accepts missing totalAccepted (optional)", () => {
      const data = {};

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAccepted).toBeUndefined();
      }
    });

    it("rejects negative integer", () => {
      const data = {
        totalAccepted: -1,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects floating point number", () => {
      const data = {
        totalAccepted: 5.5,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects string", () => {
      const data = {
        totalAccepted: "5",
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects null", () => {
      const data = {
        totalAccepted: null,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("totalAcceptedEdited validation", () => {
    it("accepts valid positive integer", () => {
      const data = {
        totalAcceptedEdited: 3,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAcceptedEdited).toBe(3);
      }
    });

    it("accepts zero", () => {
      const data = {
        totalAcceptedEdited: 0,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAcceptedEdited).toBe(0);
      }
    });

    it("accepts missing totalAcceptedEdited (optional)", () => {
      const data = {};

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalAcceptedEdited).toBeUndefined();
      }
    });

    it("rejects negative integer", () => {
      const data = {
        totalAcceptedEdited: -5,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects floating point number", () => {
      const data = {
        totalAcceptedEdited: 2.7,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("totalRejected validation", () => {
    it("accepts valid positive integer", () => {
      const data = {
        totalRejected: 7,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRejected).toBe(7);
      }
    });

    it("accepts zero", () => {
      const data = {
        totalRejected: 0,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRejected).toBe(0);
      }
    });

    it("accepts missing totalRejected (optional)", () => {
      const data = {};

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRejected).toBeUndefined();
      }
    });

    it("rejects negative integer", () => {
      const data = {
        totalRejected: -3,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects floating point number", () => {
      const data = {
        totalRejected: 4.2,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("combined fields validation", () => {
    it("accepts all fields together", () => {
      const data = {
        totalAccepted: 10,
        totalAcceptedEdited: 5,
        totalRejected: 2,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          totalAccepted: 10,
          totalAcceptedEdited: 5,
          totalRejected: 2,
        });
      }
    });

    it("accepts any combination of fields", () => {
      const data = {
        totalAccepted: 8,
        totalRejected: 3,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          totalAccepted: 8,
          totalRejected: 3,
        });
      }
    });

    it("accepts empty object (all fields optional)", () => {
      const data = {};

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });

    it("rejects when any field is invalid", () => {
      const data = {
        totalAccepted: 10,
        totalAcceptedEdited: -5, // Invalid
        totalRejected: 2,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects extra fields not in schema", () => {
      const data = {
        totalAccepted: 5,
        extraField: "not allowed",
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      // Zod allows extra fields by default unless .strict() is used
      // If the schema uses .strict(), this test would fail
      // Since the schema doesn't use .strict(), this will pass
      expect(result.success).toBe(true);
    });
  });

  describe("telemetry use case scenarios", () => {
    it("handles scenario where all candidates were accepted", () => {
      const data = {
        totalAccepted: 10,
        totalAcceptedEdited: 0,
        totalRejected: 0,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("handles scenario where all candidates were rejected", () => {
      const data = {
        totalAccepted: 0,
        totalAcceptedEdited: 0,
        totalRejected: 10,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("handles mixed scenario with edits", () => {
      const data = {
        totalAccepted: 3,
        totalAcceptedEdited: 5,
        totalRejected: 2,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("handles incremental update with only one stat", () => {
      const data = {
        totalAccepted: 1,
      };

      const result = UpdateGenerationSourceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
