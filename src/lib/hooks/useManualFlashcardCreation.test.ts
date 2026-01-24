import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useManualFlashcardCreation } from "./useManualFlashcardCreation";
import type { FlashcardDto } from "@/types";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useManualFlashcardCreation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Walidacja front/back (US-006)", () => {
    it("should validate empty front field", async () => {
      const { result } = renderHook(() => useManualFlashcardCreation());

      act(() => {
        result.current.setFront("");
        result.current.setBack("Valid back");
      });

      const flashcard = await act(async () => {
        return await result.current.submitFlashcard();
      });

      expect(flashcard).toBeNull();
      expect(result.current.errors.front).toBe("Front cannot be empty");
    });

    it("should validate empty back field", async () => {
      const { result } = renderHook(() => useManualFlashcardCreation());

      act(() => {
        result.current.setFront("Valid front");
        result.current.setBack("");
      });

      const flashcard = await act(async () => {
        return await result.current.submitFlashcard();
      });

      expect(flashcard).toBeNull();
      expect(result.current.errors.back).toBe("Back cannot be empty");
    });

    it("should validate front max length (200 chars)", async () => {
      const { result } = renderHook(() => useManualFlashcardCreation());

      act(() => {
        result.current.setFront("a".repeat(201));
        result.current.setBack("Valid back");
      });

      const flashcard = await act(async () => {
        return await result.current.submitFlashcard();
      });

      expect(flashcard).toBeNull();
      expect(result.current.errors.front).toBe("Front must not exceed 200 characters");
    });

    it("should validate back max length (500 chars)", async () => {
      const { result } = renderHook(() => useManualFlashcardCreation());

      act(() => {
        result.current.setFront("Valid front");
        result.current.setBack("a".repeat(501));
      });

      const flashcard = await act(async () => {
        return await result.current.submitFlashcard();
      });

      expect(flashcard).toBeNull();
      expect(result.current.errors.back).toBe("Back must not exceed 500 characters");
    });

    it("should accept valid input at boundaries", async () => {
      const mockResponse: FlashcardDto[] = [
        {
          id: "1",
          front: "a".repeat(200),
          back: "b".repeat(500),
          sourceType: "manual",
          generationSourceId: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useManualFlashcardCreation());

      act(() => {
        result.current.setFront("a".repeat(200));
        result.current.setBack("b".repeat(500));
      });

      const flashcard = await act(async () => {
        return await result.current.submitFlashcard();
      });

      expect(flashcard).not.toBeNull();
      expect(result.current.errors).toEqual({});
    });
  });

  describe("sourceType: manual (US-006)", () => {
    it("should submit with sourceType=manual", async () => {
      const mockResponse: FlashcardDto[] = [
        {
          id: "1",
          front: "Front",
          back: "Back",
          sourceType: "manual",
          generationSourceId: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useManualFlashcardCreation());

      act(() => {
        result.current.setFront("Front");
        result.current.setBack("Back");
      });

      await act(async () => {
        await result.current.submitFlashcard();
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody[0]).toMatchObject({
        front: "Front",
        back: "Back",
        sourceType: "manual",
        generationSourceId: null,
      });
    });
  });

  describe("Auto-reset after success (US-006)", () => {
    it("should reset form after successful submit", async () => {
      const mockResponse: FlashcardDto[] = [
        {
          id: "1",
          front: "Front",
          back: "Back",
          sourceType: "manual",
          generationSourceId: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useManualFlashcardCreation());

      act(() => {
        result.current.setFront("Front");
        result.current.setBack("Back");
      });

      await act(async () => {
        await result.current.submitFlashcard();
      });

      expect(result.current.front).toBe("");
      expect(result.current.back).toBe("");
      expect(result.current.errors).toEqual({});
    });
  });
});
