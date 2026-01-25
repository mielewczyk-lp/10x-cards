import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAiGenerationFlow } from "./useAiGenerationFlow";
import type { CreateGenerationSourceResponseDto } from "@/types";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useAiGenerationFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Walidacja inputText (US-003: 1000-10000 znaków)", () => {
    it("should reject text shorter than 1000 characters", () => {
      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("a".repeat(999));
      });

      expect(result.current.inputError).toBe("Text must be at least 1000 characters");
    });

    it("should reject text longer than 10000 characters", () => {
      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("a".repeat(10001));
      });

      expect(result.current.inputError).toBe("Text must not exceed 10000 characters");
    });

    it("should accept valid text at boundaries", () => {
      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("a".repeat(1000));
      });
      expect(result.current.inputError).toBeNull();

      act(() => {
        result.current.setInputText("a".repeat(10000));
      });
      expect(result.current.inputError).toBeNull();
    });

    it("should prevent generate when validation fails", async () => {
      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("short");
      });

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.error).toBe("Invalid input text length");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Stats calculation - pending jako rejected (PRD sekcja 6)", () => {
    it("should calculate stats with all statuses", async () => {
      const mockResponse: CreateGenerationSourceResponseDto = {
        id: "source-123",
        createdAt: "2024-01-01T00:00:00Z",
        candidates: [
          { front: "Q1", back: "A1" },
          { front: "Q2", back: "A2" },
          { front: "Q3", back: "A3" },
          { front: "Q4", back: "A4" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("a".repeat(1000));
      });

      await act(async () => {
        await result.current.generate();
      });

      // Accept, edit, reject, leave pending
      act(() => {
        result.current.updateCandidate("source-123-0", { status: "accepted" });
        result.current.updateCandidate("source-123-1", { status: "edited" });
        result.current.updateCandidate("source-123-2", { status: "rejected" });
      });

      expect(result.current.stats).toEqual({
        total: 4,
        pending: 1,
        accepted: 1,
        edited: 1,
        rejected: 1,
      });
    });
  });

  describe("sourceType logic: ai-full vs ai-edited (US-005)", () => {
    it("should set sourceType=ai-full for accepted without edits", async () => {
      const mockGenResponse: CreateGenerationSourceResponseDto = {
        id: "source-123",
        createdAt: "2024-01-01T00:00:00Z",
        candidates: [{ front: "Q1", back: "A1" }],
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockGenResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("a".repeat(1000));
      });

      await act(async () => {
        await result.current.generate();
      });

      act(() => {
        result.current.updateCandidate("source-123-0", { status: "accepted" });
      });

      await act(async () => {
        await result.current.saveAccepted();
      });

      const saveCall = mockFetch.mock.calls.find((call) => call[0].includes("/api/flashcards"));
      const body = JSON.parse(saveCall[1].body);

      expect(body[0].sourceType).toBe("ai-full");
    });

    it("should set sourceType=ai-edited for edited candidates", async () => {
      const mockGenResponse: CreateGenerationSourceResponseDto = {
        id: "source-123",
        createdAt: "2024-01-01T00:00:00Z",
        candidates: [{ front: "Q1", back: "A1" }],
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockGenResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("a".repeat(1000));
      });

      await act(async () => {
        await result.current.generate();
      });

      act(() => {
        result.current.updateCandidate("source-123-0", {
          front: "Edited Q1",
          status: "edited",
        });
      });

      await act(async () => {
        await result.current.saveAccepted();
      });

      const saveCall = mockFetch.mock.calls.find((call) => call[0].includes("/api/flashcards"));
      const body = JSON.parse(saveCall[1].body);

      expect(body[0].sourceType).toBe("ai-edited");
    });
  });

  describe("Guard: no candidates to save", () => {
    it("should prevent save when all candidates are pending or rejected", async () => {
      const mockResponse: CreateGenerationSourceResponseDto = {
        id: "source-123",
        createdAt: "2024-01-01T00:00:00Z",
        candidates: [{ front: "Q1", back: "A1" }],
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useAiGenerationFlow());

      act(() => {
        result.current.setInputText("a".repeat(1000));
      });

      await act(async () => {
        await result.current.generate();
      });

      // Don't accept any - all remain pending
      mockFetch.mockClear();

      await act(async () => {
        await result.current.saveAccepted();
      });

      expect(result.current.error).toBe("No candidates to save");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
