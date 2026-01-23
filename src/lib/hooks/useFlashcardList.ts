import { useState, useCallback, useEffect } from "react";
import type {
  FlashcardDto,
  PaginatedFlashcardsDto,
  ErrorResponseDto,
  FlashcardSortOption,
  SortOrder,
} from "../../types";

interface UseFlashcardListParams {
  initialPage?: number;
  initialPageSize?: number;
  initialSort?: FlashcardSortOption;
  initialOrder?: SortOrder;
}

interface UseFlashcardListReturn {
  // Data
  flashcards: FlashcardDto[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  sort: FlashcardSortOption;
  order: SortOrder;
  searchQuery: string;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFlashcards: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (sort: FlashcardSortOption) => void;
  setOrder: (order: SortOrder) => void;
  setSearchQuery: (query: string) => void;
  deleteFlashcard: (id: string) => Promise<void>;
  updateFlashcard: (updatedFlashcard: FlashcardDto) => void;
  refreshList: () => Promise<void>;
}

/**
 * Custom hook for managing flashcard list state and operations
 *
 * Handles:
 * - Fetching paginated flashcards
 * - Search functionality
 * - Sorting and pagination
 * - Delete operations with optimistic updates
 * - Error handling
 */
export function useFlashcardList({
  initialPage = 1,
  initialPageSize = 20,
  initialSort = "created_at",
  initialOrder = "desc",
}: UseFlashcardListParams = {}): UseFlashcardListReturn {
  // Data state
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Query parameters
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<FlashcardSortOption>(initialSort);
  const [order, setOrder] = useState<SortOrder>(initialOrder);
  const [searchQuery, setSearchQuery] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch flashcards from API
   */
  const fetchFlashcards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sort,
        order,
      });

      // Add search query if present
      if (searchQuery.trim()) {
        params.append("q", searchQuery.trim());
      }

      const response = await fetch(`/api/flashcards?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login on unauthorized
          window.location.href = "/login";
          return;
        }

        const errorData: ErrorResponseDto = await response.json().catch(() => ({
          error: { message: "Failed to fetch flashcards" },
        }));

        throw new Error(errorData.error.message || "Failed to fetch flashcards");
      }

      const data: PaginatedFlashcardsDto = await response.json();

      setFlashcards(data.items);
      setTotalItems(data.totalItems);
      setTotalPages(data.totalPages);
      setPage(data.page);
      setPageSize(data.pageSize);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error fetching flashcards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, order, searchQuery]);

  /**
   * Delete a flashcard with optimistic update
   */
  const deleteFlashcard = useCallback(
    async (id: string) => {
      // Store current flashcards for rollback
      const previousFlashcards = [...flashcards];

      // Optimistic update - remove flashcard from list
      setFlashcards((prev) => prev.filter((fc) => fc.id !== id));

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login on unauthorized
            window.location.href = "/login";
            return;
          }

          const errorData: ErrorResponseDto = await response.json().catch(() => ({
            error: { message: "Failed to delete flashcard" },
          }));

          throw new Error(errorData.error.message || "Failed to delete flashcard");
        }

        // Success - refresh the list to get updated pagination
        await fetchFlashcards();
      } catch (err) {
        // Rollback on error
        setFlashcards(previousFlashcards);

        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Error deleting flashcard:", err);

        throw err; // Re-throw to let caller handle UI feedback
      }
    },
    [flashcards, fetchFlashcards]
  );

  /**
   * Update a single flashcard in the list (optimistic update)
   */
  const updateFlashcard = useCallback((updatedFlashcard: FlashcardDto) => {
    setFlashcards((prev) => prev.map((fc) => (fc.id === updatedFlashcard.id ? updatedFlashcard : fc)));
  }, []);

  /**
   * Refresh the list (useful after updates)
   */
  const refreshList = useCallback(async () => {
    await fetchFlashcards();
  }, [fetchFlashcards]);

  // Fetch flashcards when query parameters change
  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Data
    flashcards,
    totalItems,
    totalPages,
    page,
    pageSize,
    sort,
    order,
    searchQuery,

    // State
    isLoading,
    error,

    // Actions
    fetchFlashcards,
    setPage,
    setPageSize,
    setSort,
    setOrder,
    setSearchQuery,
    deleteFlashcard,
    updateFlashcard,
    refreshList,
  };
}
