import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { FlashcardDto, FlashcardSortOption, SortOrder } from "../../types";

interface FlashcardTableProps {
  flashcards: FlashcardDto[];
  sort: FlashcardSortOption;
  order: SortOrder;
  onSortChange: (sort: FlashcardSortOption) => void;
  onOrderChange: (order: SortOrder) => void;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  isLoading: boolean;
}

/**
 * Table component for displaying flashcards
 *
 * Features:
 * - Sortable columns (created_at, updated_at)
 * - Source type badges
 * - Edit and delete actions
 * - Responsive design with horizontal scroll on mobile
 * - ARIA labels for accessibility
 */
export function FlashcardTable({
  flashcards,
  sort,
  order,
  onSortChange,
  onOrderChange,
  onEdit,
  onDelete,
  isLoading,
}: FlashcardTableProps) {
  /**
   * Get source type badge variant
   */
  const getSourceBadgeVariant = (sourceType: FlashcardDto["sourceType"]) => {
    switch (sourceType) {
      case "ai-full":
        return "default";
      case "ai-edited":
        return "secondary";
      case "manual":
        return "outline";
      default:
        return "outline";
    }
  };

  /**
   * Get source type label
   */
  const getSourceLabel = (sourceType: FlashcardDto["sourceType"]) => {
    switch (sourceType) {
      case "ai-full":
        return "AI";
      case "ai-edited":
        return "AI (edited)";
      case "manual":
        return "Manual";
      default:
        return sourceType;
    }
  };

  /**
   * Format date string
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  /**
   * Handle sort column click
   */
  const handleSortClick = (column: FlashcardSortOption) => {
    if (sort === column) {
      // Toggle order if same column
      onOrderChange(order === "asc" ? "desc" : "asc");
    } else {
      // Change column and reset to descending
      onSortChange(column);
      onOrderChange("desc");
    }
  };

  /**
   * Get sort icon for column
   */
  const getSortIcon = (column: FlashcardSortOption) => {
    if (sort !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-40" />;
    }

    return order === "asc" ? <ArrowUp className="h-4 w-4 ml-1" /> : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" data-test-id="flashcard-table">
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                Front
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                Back
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                Source
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                <button
                  onClick={() => handleSortClick("created_at")}
                  className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  aria-label="Sort by created date"
                >
                  Created
                  {getSortIcon("created_at")}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                <button
                  onClick={() => handleSortClick("updated_at")}
                  className="flex items-center hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
                  aria-label="Sort by updated date"
                >
                  Updated
                  {getSortIcon("updated_at")}
                </button>
              </th>
              <th className="text-right px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={isLoading ? "opacity-50" : ""} data-test-id="flashcard-table-body">
            {flashcards.map((flashcard, index) => (
              <tr
                key={flashcard.id}
                className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                data-test-id={`flashcard-row-${index}`}
              >
                <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100 max-w-xs">
                  <div className="line-clamp-2" data-test-id={`flashcard-front-${index}`}>
                    {flashcard.front}
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs">
                  <div className="line-clamp-2" data-test-id={`flashcard-back-${index}`}>
                    {flashcard.back}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getSourceBadgeVariant(flashcard.sourceType)}>
                    {getSourceLabel(flashcard.sourceType)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                  {formatDate(flashcard.createdAt)}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                  {formatDate(flashcard.updatedAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(flashcard)}
                      aria-label={`Edit flashcard: ${flashcard.front}`}
                      data-test-id={`flashcard-edit-button-${index}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(flashcard)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                      aria-label={`Delete flashcard: ${flashcard.front}`}
                      data-test-id={`flashcard-delete-button-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
