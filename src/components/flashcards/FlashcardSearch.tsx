import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlashcardSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalItems: number;
  isLoading: boolean;
}

/**
 * Search input component for flashcards
 *
 * Features:
 * - Debounced search input
 * - Clear button
 * - Result count display
 * - ARIA labels for accessibility
 */
export function FlashcardSearch({ searchQuery, onSearchChange, totalItems, isLoading }: FlashcardSearchProps) {
  const [inputValue, setInputValue] = useState(searchQuery);

  // Debounce search query updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue !== searchQuery) {
        onSearchChange(inputValue);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue, searchQuery, onSearchChange]);

  // Sync with external changes
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  /**
   * Handle clear button click
   */
  const handleClear = () => {
    setInputValue("");
    onSearchChange("");
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          type="text"
          placeholder="Search flashcards..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Search flashcards"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Result count */}
      <div className="text-sm text-neutral-600 dark:text-neutral-400" aria-live="polite" aria-atomic="true">
        {isLoading ? (
          "Searching..."
        ) : (
          <>
            {totalItems === 0 ? "No" : totalItems} {totalItems === 1 ? "flashcard" : "flashcards"}
            {searchQuery && " found"}
          </>
        )}
      </div>
    </div>
  );
}
