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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { FlashcardDto, UpdateFlashcardCommand, ErrorResponseDto } from "../../types";

interface EditFlashcardModalProps {
  flashcard: FlashcardDto;
  onSave: (updatedFlashcard: FlashcardDto) => void;
  onCancel: () => void;
}

/**
 * Modal component for editing a flashcard
 *
 * Features:
 * - Pre-filled form with current values
 * - Client-side validation
 * - Error handling with retry
 * - Loading state during save
 * - Accessible dialog with focus trap
 */
export function EditFlashcardModal({ flashcard, onSave, onCancel }: EditFlashcardModalProps) {
  const [front, setFront] = useState(flashcard.front);
  const [back, setBack] = useState(flashcard.back);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!front.trim()) {
      errors.front = "Front is required";
    } else if (front.trim().length > 200) {
      errors.front = "Front must be 200 characters or less";
    }

    if (!back.trim()) {
      errors.back = "Back is required";
    } else if (back.trim().length > 500) {
      errors.back = "Back must be 500 characters or less";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setFieldErrors({});

    // Validate
    if (!validateForm()) {
      return;
    }

    // Check if anything changed
    if (front.trim() === flashcard.front && back.trim() === flashcard.back) {
      onCancel();
      return;
    }

    setIsSaving(true);

    try {
      const updateData: UpdateFlashcardCommand = {};

      if (front.trim() !== flashcard.front) {
        updateData.front = front.trim();
      }

      if (back.trim() !== flashcard.back) {
        updateData.back = back.trim();
      }

      const response = await fetch(`/api/flashcards/${flashcard.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        const errorData: ErrorResponseDto = await response.json().catch(() => ({
          error: { message: "Failed to update flashcard" },
        }));

        // Handle field-level errors
        if (errorData.error.fields) {
          setFieldErrors(errorData.error.fields);
        }

        throw new Error(errorData.error.message || "Failed to update flashcard");
      }

      // Parse the updated flashcard from response
      const updatedFlashcard: FlashcardDto = await response.json();

      // Success - pass updated flashcard to parent
      onSave(updatedFlashcard);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      console.error("Error updating flashcard:", err);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle input change and clear field error
   */
  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFront(e.target.value);
    if (fieldErrors.front) {
      setFieldErrors((prev) => {
        const { front, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBack(e.target.value);
    if (fieldErrors.back) {
      setFieldErrors((prev) => {
        const { back, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[600px]" data-test-id="edit-flashcard-modal">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Make changes to your flashcard. Click save when you're done.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} data-test-id="edit-flashcard-form">
          <div className="space-y-4 py-4">
            {/* Error alert */}
            {error && (
              <Alert variant="destructive" data-test-id="edit-flashcard-error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Front field */}
            <div className="space-y-2">
              <Label htmlFor="edit-front">
                Front <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-front"
                value={front}
                onChange={handleFrontChange}
                placeholder="Enter front of flashcard"
                disabled={isSaving}
                className={fieldErrors.front ? "border-red-500" : ""}
                maxLength={200}
                data-test-id="edit-flashcard-front-input"
              />
              {fieldErrors.front && <p className="text-sm text-red-500">{fieldErrors.front}</p>}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{front.length}/200 characters</p>
            </div>

            {/* Back field */}
            <div className="space-y-2">
              <Label htmlFor="edit-back">
                Back <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-back"
                value={back}
                onChange={handleBackChange}
                placeholder="Enter back of flashcard"
                disabled={isSaving}
                className={fieldErrors.back ? "border-red-500" : ""}
                rows={4}
                maxLength={500}
                data-test-id="edit-flashcard-back-input"
              />
              {fieldErrors.back && <p className="text-sm text-red-500">{fieldErrors.back}</p>}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{back.length}/500 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSaving}
              data-test-id="edit-flashcard-cancel-button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} data-test-id="edit-flashcard-save-button">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
