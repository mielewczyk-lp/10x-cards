import { useCallback, useEffect } from "react";
import { useManualFlashcardCreation } from "@/lib/hooks/useManualFlashcardCreation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function ManualFlashcardForm() {
  const { front, back, errors, isSubmitting, setFront, setBack, submitFlashcard } = useManualFlashcardCreation();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const createdFlashcard = await submitFlashcard();
        if (createdFlashcard) {
          toast.success("Flashcard created successfully!");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create flashcard";
        toast.error(errorMessage);
      }
    },
    [submitFlashcard]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  return (
    <>
      <Toaster />
      <Card>
        <CardHeader>
          <CardTitle>Create Flashcard Manually</CardTitle>
          <CardDescription>
            Enter the front and back of your flashcard. Press Ctrl+Enter to save quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" data-test-id="manual-flashcard-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-front">
                  Front <span className="text-sm text-neutral-500">({front.length}/200)</span>
                </Label>
                <Textarea
                  id="manual-front"
                  data-test-id="flashcard-front-input"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter the question or prompt..."
                  maxLength={200}
                  className={`min-h-[150px] ${errors.front ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  aria-invalid={!!errors.front}
                  aria-describedby={errors.front ? "manual-front-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.front && (
                  <p id="manual-front-error" className="text-sm text-red-600 dark:text-red-400" role="alert" data-test-id="flashcard-front-error">
                    {errors.front}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-back">
                  Back <span className="text-sm text-neutral-500">({back.length}/500)</span>
                </Label>
                <Textarea
                  id="manual-back"
                  data-test-id="flashcard-back-input"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter the answer or explanation..."
                  maxLength={500}
                  className={`min-h-[150px] ${errors.back ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  aria-invalid={!!errors.back}
                  aria-describedby={errors.back ? "manual-back-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.back && (
                  <p id="manual-back-error" className="text-sm text-red-600 dark:text-red-400" role="alert" data-test-id="flashcard-back-error">
                    {errors.back}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || front.trim().length === 0 || back.trim().length === 0} data-test-id="save-flashcard-button">
                {isSubmitting ? "Saving..." : "Save Flashcard"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
