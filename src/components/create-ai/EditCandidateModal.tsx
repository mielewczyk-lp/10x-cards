import { useState, useEffect, useCallback } from "react";
import type { FlashcardCandidate } from "@/lib/hooks/useAiGenerationFlow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: FlashcardCandidate;
  onSave: (front: string, back: string) => void;
}

export function EditCandidateModal({ isOpen, onClose, candidate, onSave }: EditCandidateModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});

  // Initialize form with candidate data
  useEffect(() => {
    if (isOpen) {
      setFront(candidate.front);
      setBack(candidate.back);
      setErrors({});
    }
  }, [isOpen, candidate]);

  const validate = useCallback(() => {
    const newErrors: { front?: string; back?: string } = {};

    const trimmedFront = front.trim();
    const trimmedBack = back.trim();

    if (trimmedFront.length === 0) {
      newErrors.front = "Front cannot be empty";
    } else if (trimmedFront.length > 200) {
      newErrors.front = "Front must not exceed 200 characters";
    }

    if (trimmedBack.length === 0) {
      newErrors.back = "Back cannot be empty";
    } else if (trimmedBack.length > 500) {
      newErrors.back = "Back must not exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [front, back]);

  const handleSave = useCallback(() => {
    if (validate()) {
      onSave(front.trim(), back.trim());
    }
  }, [validate, onSave, front, back]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Make changes to the flashcard content. Press Ctrl+Enter to save.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-front">Front {front.length}/200</Label>
            <Textarea
              id="edit-front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Front of the flashcard..."
              className={`min-h-[100px] ${errors.front ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              aria-invalid={!!errors.front}
              aria-describedby={errors.front ? "front-error" : undefined}
            />
            {errors.front && (
              <p id="front-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.front}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-back">Back {back.length}/500</Label>
            <Textarea
              id="edit-back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Back of the flashcard..."
              className={`min-h-[150px] ${errors.back ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              aria-invalid={!!errors.back}
              aria-describedby={errors.back ? "back-error" : undefined}
            />
            {errors.back && (
              <p id="back-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.back}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
