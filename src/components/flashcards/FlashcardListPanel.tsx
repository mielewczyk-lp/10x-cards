import { useState } from "react";
import { useFlashcardList } from "@/lib/hooks/useFlashcardList";
import { FlashcardTable } from "./FlashcardTable";
import { FlashcardSearch } from "./FlashcardSearch";
import { FlashcardPagination } from "./FlashcardPagination";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { FlashcardDto } from "../../types";

/**
 * Main panel component for flashcard list view
 *
 * Orchestrates:
 * - Search functionality
 * - Pagination
 * - Table display
 * - Edit modal
 * - Delete confirmation
 */
export default function FlashcardListPanel() {
  const {
    flashcards,
    totalItems,
    totalPages,
    page,
    pageSize,
    sort,
    order,
    searchQuery,
    isLoading,
    error,
    setPage,
    setPageSize,
    setSort,
    setOrder,
    setSearchQuery,
    deleteFlashcard,
    updateFlashcard,
  } = useFlashcardList();

  // Modal and dialog state
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDto | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardDto | null>(null);

  /**
   * Handle edit button click
   */
  const handleEdit = (flashcard: FlashcardDto) => {
    setEditingFlashcard(flashcard);
  };

  /**
   * Handle edit modal save with optimistic update
   */
  const handleEditSave = (updatedFlashcard: FlashcardDto) => {
    // Update the flashcard in the list with the data from the API response
    updateFlashcard(updatedFlashcard);
    setEditingFlashcard(null);
  };

  /**
   * Handle edit modal cancel
   */
  const handleEditCancel = () => {
    setEditingFlashcard(null);
  };

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (flashcard: FlashcardDto) => {
    setDeletingFlashcard(flashcard);
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!deletingFlashcard) return;

    try {
      await deleteFlashcard(deletingFlashcard.id);
      setDeletingFlashcard(null);
    } catch {
      // Error is already handled in the hook
      // Dialog will stay open to let user retry
    }
  };

  /**
   * Handle delete cancel
   */
  const handleDeleteCancel = () => {
    setDeletingFlashcard(null);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <FlashcardSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalItems={totalItems}
        isLoading={isLoading}
      />

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && flashcards.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading flashcards...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && flashcards.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400 text-lg">No flashcards found.</p>
          <p className="text-neutral-500 dark:text-neutral-500 text-sm mt-2">
            {searchQuery ? "Try adjusting your search." : "Create your first flashcard to get started!"}
          </p>
          {!searchQuery && (
            <a
              href="/create"
              className="inline-block mt-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:underline"
            >
              Go to Create Page
            </a>
          )}
        </div>
      )}

      {/* Table */}
      {flashcards.length > 0 && (
        <>
          <FlashcardTable
            flashcards={flashcards}
            sort={sort}
            order={order}
            onSortChange={setSort}
            onOrderChange={setOrder}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            isLoading={isLoading}
          />

          {/* Pagination */}
          <FlashcardPagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      {/* Edit modal */}
      {editingFlashcard && (
        <EditFlashcardModal flashcard={editingFlashcard} onSave={handleEditSave} onCancel={handleEditCancel} />
      )}

      {/* Delete confirmation dialog */}
      {deletingFlashcard && (
        <DeleteFlashcardDialog
          flashcard={deletingFlashcard}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
