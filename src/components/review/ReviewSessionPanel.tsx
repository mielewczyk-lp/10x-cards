import { useEffect, useState } from "react";
import { useReviewSession } from "@/lib/hooks/useReviewSession";
import { ReviewCard } from "./ReviewCard";
import { AnswerButtons } from "./AnswerButtons";
import { ReviewProgress } from "./ReviewProgress";
import { ReviewEmptyState } from "./ReviewEmptyState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * Main panel component for review session
 *
 * Features:
 * - Automatically starts session on mount
 * - Shows current flashcard with flip functionality
 * - Answer buttons (Again/Hard/Good/Easy)
 * - Progress tracking
 * - Empty state when no flashcards available
 * - Error handling with toast notifications
 */
export function ReviewSessionPanel() {
  const {
    currentFlashcard,
    isLoading,
    error,
    sessionActive,
    nextReviewDate,
    progress,
    startSession,
    submitAnswer,
    endSession,
  } = useReviewSession();

  const [showAnswerButtons, setShowAnswerButtons] = useState(false);

  // Start session on mount
  useEffect(() => {
    startSession().catch((err) => {
      toast.error("Failed to start review session", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    });
  }, [startSession]);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error("Error", {
        description: error,
      });
    }
  }, [error]);

  // Handle answer submission
  const handleAnswer = async (grade: number) => {
    try {
      await submitAnswer(grade);
      setShowAnswerButtons(false);
      toast.success("Answer recorded");
    } catch (err) {
      toast.error("Failed to submit answer", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Handle navigation to flashcards
  const handleNavigateToFlashcards = () => {
    window.location.href = "/flashcards";
  };

  // Handle end session
  const handleEndSession = () => {
    if (
      confirm(
        "Are you sure you want to cancel this session? Reviewed cards have been saved, but remaining cards will not be reviewed."
      )
    ) {
      endSession();
      window.location.href = "/flashcards";
    }
  };

  // Loading state
  if (isLoading && !currentFlashcard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state - no flashcards available
  if (!sessionActive && !isLoading) {
    return <ReviewEmptyState onNavigateToFlashcards={handleNavigateToFlashcards} nextReviewDate={nextReviewDate} />;
  }

  // Session completed
  if (sessionActive && !currentFlashcard && progress.reviewed > 0) {
    return (
      <div className="space-y-6">
        <ReviewProgress current={progress.current} total={progress.total} reviewed={progress.reviewed} />
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Session Complete!</h2>
          <p className="text-muted-foreground">
            You&apos;ve reviewed {progress.reviewed} flashcard{progress.reviewed !== 1 ? "s" : ""}.
          </p>
          <Button onClick={handleNavigateToFlashcards} size="lg">
            Back to Flashcards
          </Button>
        </div>
      </div>
    );
  }

  // Active session with current flashcard
  if (currentFlashcard) {
    return (
      <div className="space-y-6">
        <ReviewProgress current={progress.current} total={progress.total} reviewed={progress.reviewed} />

        <ReviewCard
          key={currentFlashcard.id}
          flashcard={currentFlashcard}
          onShowAnswer={() => setShowAnswerButtons(true)}
        />

        {showAnswerButtons && <AnswerButtons onAnswer={handleAnswer} disabled={isLoading} />}

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleEndSession}
            variant="link"
            size="sm"
            className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 cursor-pointer"
          >
            Cancel Session
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
