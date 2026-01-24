import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFreeLearning } from "./useFreeLearning";
import type { StartPracticeResponseDto } from "@/types";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useFreeLearning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Practice limits (10, 20, 50)", () => {
    it.each([10, 20, 50] as const)("should start practice with limit=%d", async (limit) => {
      const mockResponse: StartPracticeResponseDto = {
        flashcards: Array.from({ length: limit }, (_, i) => ({
          id: `${i}`,
          front: `Q${i}`,
          back: `A${i}`,
        })),
        total: limit,
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useFreeLearning());

      await act(async () => {
        await result.current.startPractice(limit);
      });

      expect(result.current.practiceActive).toBe(true);
      expect(result.current.progress.total).toBe(limit);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/flashcards/practice",
        expect.objectContaining({
          body: JSON.stringify({ limit }),
        })
      );
    });
  });

  describe("Navigation through queue", () => {
    it("should move through flashcards and end when complete", async () => {
      const mockResponse: StartPracticeResponseDto = {
        flashcards: [
          { id: "1", front: "Q1", back: "A1" },
          { id: "2", front: "Q2", back: "A2" },
        ],
        total: 2,
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useFreeLearning());

      await act(async () => {
        await result.current.startPractice(10);
      });

      expect(result.current.currentFlashcard?.id).toBe("1");
      expect(result.current.progress.current).toBe(1);

      act(() => {
        result.current.nextCard();
      });

      expect(result.current.currentFlashcard?.id).toBe("2");
      expect(result.current.progress.current).toBe(2);

      act(() => {
        result.current.nextCard();
      });

      expect(result.current.practiceActive).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe("Empty practice queue", () => {
    it("should handle empty flashcard list", async () => {
      const mockResponse: StartPracticeResponseDto = {
        flashcards: [],
        total: 0,
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useFreeLearning());

      await act(async () => {
        await result.current.startPractice(10);
      });

      expect(result.current.practiceActive).toBe(false);
      expect(result.current.currentFlashcard).toBeNull();
      expect(result.current.totalFlashcards).toBe(0);
    });
  });
});
