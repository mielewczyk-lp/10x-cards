import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import type { FlashcardDto } from "../../types";

interface DeleteFlashcardDialogProps {
  flashcard: FlashcardDto;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

/**
 * Confirmation dialog for deleting a flashcard
 *
 * Features:
 * - Clear warning about permanent deletion
 * - Shows flashcard front for context
 * - Error handling with retry option
 * - Loading state during deletion
 * - Accessible dialog with focus trap
 */
export function DeleteFlashcardDialog({ flashcard, onConfirm, onCancel }: DeleteFlashcardDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle delete confirmation
   */
  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm();
      // Dialog will be closed by parent on success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !isDeleting && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            Delete Flashcard?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the flashcard from your account.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Error alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Flashcard preview */}
          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-900">
            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Front:</div>
            <div className="text-neutral-900 dark:text-neutral-100 line-clamp-2">{flashcard.front}</div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
