import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFlashcardList } from "./useFlashcardList";
import type { PaginatedFlashcardsDto, FlashcardDto } from "@/types";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useFlashcardList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Optimistic update with rollback (US-009)", () => {
    it("should optimistically remove flashcard and rollback on error", async () => {
      const mockFlashcards: FlashcardDto[] = [
        {
          id: "1",
          front: "Q1",
          back: "A1",
          sourceType: "manual",
          generationSourceId: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          front: "Q2",
          back: "A2",
          sourceType: "manual",
          generationSourceId: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const mockResponse: PaginatedFlashcardsDto = {
        items: mockFlashcards,
        page: 1,
        pageSize: 20,
        totalItems: 2,
        totalPages: 1,
      };

      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useFlashcardList());

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(2);
      });

      // Delete fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: "Database error" } }),
      });

      try {
        await act(async () => {
          await result.current.deleteFlashcard("1");
        });
      } catch {
        // Expected to throw
      }

      // Should rollback - flashcards should still be 2
      expect(result.current.flashcards).toHaveLength(2);
      expect(result.current.flashcards.find((fc) => fc.id === "1")).toBeDefined();
    });

    it("should optimistically remove and refresh list on success", async () => {
      const mockFlashcards: FlashcardDto[] = [
        {
          id: "1",
          front: "Q1",
          back: "A1",
          sourceType: "manual",
          generationSourceId: null,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const mockInitialResponse: PaginatedFlashcardsDto = {
        items: mockFlashcards,
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      };

      const mockAfterDeleteResponse: PaginatedFlashcardsDto = {
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockInitialResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // DELETE success
        .mockResolvedValueOnce({ ok: true, json: async () => mockAfterDeleteResponse }); // refresh

      const { result } = renderHook(() => useFlashcardList());

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(1);
      });

      await act(async () => {
        await result.current.deleteFlashcard("1");
      });

      await waitFor(() => {
        expect(result.current.flashcards).toHaveLength(0);
      });
    });
  });

  describe("Search resets page to 1 (US-007)", () => {
    it("should reset page to 1 when search query changes", async () => {
      const mockResponse: PaginatedFlashcardsDto = {
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
      };

      mockFetch.mockResolvedValue({ ok: true, json: async () => mockResponse });

      const { result } = renderHook(() => useFlashcardList());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Go to page 3
      act(() => {
        result.current.setPage(3);
      });

      await waitFor(() => {
        expect(result.current.page).toBe(3);
      });

      // Change search query
      act(() => {
        result.current.setSearchQuery("test");
      });

      await waitFor(() => {
        expect(result.current.page).toBe(1);
      });
    });
  });

  describe("401 redirect to login", () => {
    it("should redirect to login on 401", async () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { ...originalLocation, href: "" } as Location;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: "Unauthorized" } }),
      });

      renderHook(() => useFlashcardList());

      await waitFor(() => {
        expect(window.location.href).toBe("/login");
      });

      window.location = originalLocation;
    });
  });
});
