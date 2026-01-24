import { describe, it, expect } from "vitest";
import { StartReviewSessionSchema, SubmitAnswerSchema } from "./reviewSessionSchemas";

describe("StartReviewSessionSchema", () => {
  describe("limit validation", () => {
    it("accepts valid limit within range", () => {
      const data = { limit: "25" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it("accepts limit at minimum value (1)", () => {
      const data = { limit: "1" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it("accepts limit at maximum value (50)", () => {
      const data = { limit: "50" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("coerces string to number", () => {
      const data = { limit: "30" };

      const result = StartReviewSessionSchema.safeParse(data);
      if (result.success) {
        expect(result.data.limit).toBe(30);
        expect(typeof result.data.limit).toBe("number");
      } else {
        throw new Error("Expected validation to succeed");
      }
    });

    it("coerces numeric value correctly", () => {
      const data = { limit: 15 };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(15);
      }
    });

    it("defaults to 20 when not provided", () => {
      const data = {};

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("defaults to 20 when undefined", () => {
      const data = { limit: undefined };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("rejects limit less than 1", () => {
      const data = { limit: "0" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects negative limit", () => {
      const data = { limit: "-5" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects limit exceeding 50", () => {
      const data = { limit: "51" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects limit exceeding 50 significantly", () => {
      const data = { limit: "100" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects non-integer limit", () => {
      const data = { limit: "20.5" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects non-numeric string", () => {
      const data = { limit: "abc" };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("rejects null", () => {
      const data = { limit: null };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("coerces boolean to number (1)", () => {
      // Note: z.coerce.number() will convert true to 1, which is valid
      const data = { limit: true };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it("rejects object", () => {
      const data = { limit: {} };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("edge cases and coercion", () => {
    it("handles numeric string with whitespace", () => {
      const data = { limit: "  25  " };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
      }
    });

    it("handles boundary value 1", () => {
      const data = { limit: 1 };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });

    it("handles boundary value 50", () => {
      const data = { limit: 50 };

      const result = StartReviewSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });
  });
});

describe("SubmitAnswerSchema", () => {
  describe("grade validation - SM-2 algorithm scale (0-5)", () => {
    it("accepts grade 0 (complete blackout)", () => {
      const data = { grade: 0 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(0);
      }
    });

    it("accepts grade 1 (incorrect but familiar)", () => {
      const data = { grade: 1 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(1);
      }
    });

    it("accepts grade 2 (incorrect but easy to recall)", () => {
      const data = { grade: 2 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(2);
      }
    });

    it("accepts grade 3 (correct with serious difficulty)", () => {
      const data = { grade: 3 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(3);
      }
    });

    it("accepts grade 4 (correct after hesitation)", () => {
      const data = { grade: 4 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(4);
      }
    });

    it("accepts grade 5 (perfect response)", () => {
      const data = { grade: 5 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(5);
      }
    });

    it("rejects grade below 0", () => {
      const data = { grade: -1 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_TOO_LOW");
      }
    });

    it("rejects grade above 5", () => {
      const data = { grade: 6 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_TOO_HIGH");
      }
    });

    it("rejects grade significantly above range", () => {
      const data = { grade: 100 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_TOO_HIGH");
      }
    });

    it("rejects grade significantly below range", () => {
      const data = { grade: -100 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_TOO_LOW");
      }
    });

    it("rejects non-integer grade", () => {
      const data = { grade: 3.5 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_MUST_BE_INTEGER");
      }
    });

    it("rejects floating point grade within range", () => {
      const data = { grade: 4.2 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_MUST_BE_INTEGER");
      }
    });

    it("rejects missing grade field", () => {
      const data = {};

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_REQUIRED");
      }
    });

    it("rejects string grade", () => {
      const data = { grade: "3" };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_INVALID");
      }
    });

    it("rejects null grade", () => {
      const data = { grade: null };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_INVALID");
      }
    });

    it("rejects undefined grade", () => {
      const data = { grade: undefined };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_REQUIRED");
      }
    });

    it("rejects boolean grade", () => {
      const data = { grade: true };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_INVALID");
      }
    });

    it("rejects object grade", () => {
      const data = { grade: {} };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_INVALID");
      }
    });

    it("rejects array grade", () => {
      const data = { grade: [3] };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("GRADE_INVALID");
      }
    });
  });

  describe("SM-2 algorithm integration scenarios", () => {
    it("handles worst possible response (complete blackout)", () => {
      const data = { grade: 0 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(0);
      }
    });

    it("handles threshold for repetition (grade < 3)", () => {
      const gradesBelowThreshold = [0, 1, 2];
      gradesBelowThreshold.forEach((grade) => {
        const result = SubmitAnswerSchema.safeParse({ grade });
        expect(result.success).toBe(true);
      });
    });

    it("handles passing grades (grade >= 3)", () => {
      const passingGrades = [3, 4, 5];
      passingGrades.forEach((grade) => {
        const result = SubmitAnswerSchema.safeParse({ grade });
        expect(result.success).toBe(true);
      });
    });

    it("handles best possible response (perfect recall)", () => {
      const data = { grade: 5 };

      const result = SubmitAnswerSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.grade).toBe(5);
      }
    });
  });
});
