import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReviewSession } from "./useReviewSession";
import type { StartReviewSessionResponseDto, SubmitAnswerResponseDto } from "@/types";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useReviewSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Start session with empty queue (US-010)", () => {
    it("should handle empty flashcard queue with nextReviewDate", async () => {
      const mockResponse: StartReviewSessionResponseDto = {
        flashcards: [],
        total: 0,
        nextReviewDate: "2024-12-25T10:00:00Z",
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useReviewSession());

      await act(async () => {
        await result.current.startSession(20);
      });

      expect(result.current.sessionActive).toBe(false);
      expect(result.current.nextReviewDate).toBe("2024-12-25T10:00:00Z");
      expect(result.current.currentFlashcard).toBeNull();
    });
  });

  describe("Progress tracking", () => {
    it("should track progress correctly through session", async () => {
      const mockStartResponse: StartReviewSessionResponseDto = {
        flashcards: [
          { id: "1", front: "Q1", back: "A1", sm2State: { interval: 1, repetition: 0, efactor: 2.5 } },
          { id: "2", front: "Q2", back: "A2", sm2State: { interval: 1, repetition: 0, efactor: 2.5 } },
        ],
        total: 2,
      };

      const mockAnswerResponse: SubmitAnswerResponseDto = {
        nextReviewAt: "2024-12-25T10:00:00Z",
        hasMore: false,
        nextFlashcard: null,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockStartResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockAnswerResponse });

      const { result } = renderHook(() => useReviewSession());

      await act(async () => {
        await result.current.startSession();
      });

      expect(result.current.progress).toEqual({
        current: 1,
        total: 2,
        reviewed: 0,
      });

      await act(async () => {
        await result.current.submitAnswer(4);
      });

      expect(result.current.progress).toEqual({
        current: 2,
        total: 2,
        reviewed: 1,
      });
    });

    it("should end session when no more flashcards", async () => {
      const mockStartResponse: StartReviewSessionResponseDto = {
        flashcards: [{ id: "1", front: "Q1", back: "A1", sm2State: { interval: 1, repetition: 0, efactor: 2.5 } }],
        total: 1,
      };

      const mockAnswerResponse: SubmitAnswerResponseDto = {
        nextReviewAt: "2024-12-25T10:00:00Z",
        hasMore: false,
        nextFlashcard: null,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockStartResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockAnswerResponse });

      const { result } = renderHook(() => useReviewSession());

      await act(async () => {
        await result.current.startSession();
      });

      expect(result.current.sessionActive).toBe(true);

      await act(async () => {
        await result.current.submitAnswer(4);
      });

      expect(result.current.sessionActive).toBe(false);
      expect(result.current.progress.reviewed).toBe(1);
    });
  });

  describe("Guard: submit answer without active session", () => {
    it("should throw error when submitting answer without active session", async () => {
      const { result } = renderHook(() => useReviewSession());

      await expect(async () => {
        await act(async () => {
          await result.current.submitAnswer(4);
        });
      }).rejects.toThrow("No active session or no current flashcard");
    });
  });

  describe("SM-2 algorithm integration (US-010)", () => {
    it("should continue session when nextFlashcard is provided", async () => {
      const mockStartResponse: StartReviewSessionResponseDto = {
        flashcards: [
          { id: "1", front: "Q1", back: "A1", sm2State: { interval: 1, repetition: 0, efactor: 2.5 } },
          { id: "2", front: "Q2", back: "A2", sm2State: { interval: 1, repetition: 0, efactor: 2.5 } },
        ],
        total: 2,
      };

      const mockAnswerResponse: SubmitAnswerResponseDto = {
        nextReviewAt: "2024-12-25T10:00:00Z",
        hasMore: true,
        nextFlashcard: { id: "3", front: "Q3", back: "A3", sm2State: { interval: 2, repetition: 1, efactor: 2.6 } },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockStartResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockAnswerResponse });

      const { result } = renderHook(() => useReviewSession());

      await act(async () => {
        await result.current.startSession();
      });

      expect(result.current.currentFlashcard?.id).toBe("1");

      await act(async () => {
        await result.current.submitAnswer(4);
      });

      // Should move to next index (which is Q2 from initial queue)
      expect(result.current.currentFlashcard?.id).toBe("2");
      expect(result.current.sessionActive).toBe(true);
      expect(result.current.progress.reviewed).toBe(1);
    });
  });
});
