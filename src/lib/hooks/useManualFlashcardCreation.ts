import { useState, useCallback } from "react";
import type { CreateFlashcardCommand, FlashcardDto } from "../../types";

interface UseManualFlashcardCreationReturn {
  front: string;
  back: string;
  errors: { front?: string; back?: string };
  isSubmitting: boolean;
  setFront: (value: string) => void;
  setBack: (value: string) => void;
  resetForm: () => void;
  submitFlashcard: () => Promise<FlashcardDto | null>;
}

/**
 * Hook for managing manual flashcard creation
 * Handles form state, validation, and API submission
 */
export function useManualFlashcardCreation(): UseManualFlashcardCreationReturn {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [errors, setErrors] = useState<{ front?: string; back?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((): boolean => {
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

  const resetForm = useCallback(() => {
    setFront("");
    setBack("");
    setErrors({});
  }, []);

  const submitFlashcard = useCallback(async (): Promise<FlashcardDto | null> => {
    // Validate before submission
    if (!validate()) {
      return null;
    }

    setIsSubmitting(true);

    try {
      const flashcardCommand: CreateFlashcardCommand = {
        front: front.trim(),
        back: back.trim(),
        sourceType: "manual",
        generationSourceId: null,
      };

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([flashcardCommand]),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
        throw new Error(errorData.error?.message || "Failed to create flashcard");
      }

      const createdFlashcards: FlashcardDto[] = await response.json();

      // Reset form on success
      resetForm();

      return createdFlashcards[0];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to create flashcard:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [front, back, validate, resetForm]);

  return {
    front,
    back,
    errors,
    isSubmitting,
    setFront,
    setBack,
    resetForm,
    submitFlashcard,
  };
}
