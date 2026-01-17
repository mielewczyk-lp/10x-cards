import { useState } from "react";
import { useFreeLearning } from "@/lib/hooks/useFreeLearning";
import { ReviewCard } from "./ReviewCard";
import { ReviewProgress } from "./ReviewProgress";
import { ReviewEmptyState } from "./ReviewEmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BookOpen } from "lucide-react";

/**
 * Panel for free learning mode (practice without affecting SM-2 schedule)
 *
 * Features:
 * - User selects number of flashcards (10/20/50)
 * - Random flashcards from entire collection
 * - Simple Next Card button (no grading)
 * - No database updates
 * - Re-uses ReviewCard and ReviewProgress components
 */
export function FreeLearningPanel() {
  const {
    currentFlashcard,
    isLoading,
    error,
    practiceActive,
    totalFlashcards,
    progress,
    isComplete,
    startPractice,
    nextCard,
  } = useFreeLearning();

  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<10 | 20 | 50>(20);
  const [hasStarted, setHasStarted] = useState(false);

  // Handle starting practice session
  const handleStartPractice = async () => {
    try {
      await startPractice(selectedLimit);
      setHasStarted(true);
      setShowAnswer(false);
    } catch (err) {
      toast.error("Failed to start practice", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Handle showing answer
  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  // Handle next card
  const handleNextCard = () => {
    nextCard();
    setShowAnswer(false);
  };

  // Handle navigation to flashcards
  const handleNavigateToFlashcards = () => {
    window.location.href = "/flashcards";
  };

  // Show error toast when error occurs
  if (error) {
    toast.error("Error", {
      description: error,
    });
  }

  // Initial state - select number of flashcards
  if (!hasStarted && !practiceActive) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Free Learning Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Practice your flashcards without affecting your review schedule. Perfect for quick revision or extra
              practice.
            </p>

            <div className="space-y-3">
              <p className="text-sm font-medium">How many flashcards would you like to practice?</p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant={selectedLimit === 10 ? "default" : "outline"}
                  onClick={() => setSelectedLimit(10)}
                  disabled={isLoading}
                  size="lg"
                >
                  10 Cards
                </Button>
                <Button
                  variant={selectedLimit === 20 ? "default" : "outline"}
                  onClick={() => setSelectedLimit(20)}
                  disabled={isLoading}
                  size="lg"
                >
                  20 Cards
                </Button>
                <Button
                  variant={selectedLimit === 50 ? "default" : "outline"}
                  onClick={() => setSelectedLimit(50)}
                  disabled={isLoading}
                  size="lg"
                >
                  50 Cards
                </Button>
              </div>
            </div>

            <Button onClick={handleStartPractice} disabled={isLoading} size="lg" className="mt-4">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Practice"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading && !currentFlashcard) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state - no flashcards available (after trying to start)
  if (hasStarted && !practiceActive && !isLoading && !isComplete && totalFlashcards === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">You don't have any flashcards yet.</p>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={() => setHasStarted(false)} variant="outline" size="lg">
                Back
              </Button>
              <Button onClick={handleNavigateToFlashcards} size="lg">
                Create Flashcards
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Session completed
  if (isComplete) {
    return (
      <div className="space-y-6">
        <ReviewProgress current={progress.current} total={progress.total} reviewed={progress.completed} />
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-green-600 dark:text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold">Practice Complete!</h2>
              <p className="text-muted-foreground">
                You've practiced {progress.completed} flashcard{progress.completed !== 1 ? "s" : ""}.
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={() => setHasStarted(false)} variant="outline" size="lg">
                  Practice Again
                </Button>
                <Button onClick={handleNavigateToFlashcards} size="lg">
                  Back to Flashcards
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active practice with current flashcard
  if (currentFlashcard) {
    return (
      <div className="space-y-6">
        <ReviewProgress current={progress.current} total={progress.total} reviewed={progress.completed} />

        <ReviewCard
          key={currentFlashcard.id}
          flashcard={{
            ...currentFlashcard,
            sm2State: { interval: 0, repetition: 0, efactor: 2.5 }, // Dummy SM-2 state for ReviewCard
          }}
          onShowAnswer={handleShowAnswer}
        />

        {showAnswer && (
          <div className="flex justify-center">
            <Button onClick={handleNextCard} size="lg" className="min-w-[200px]">
              Next Card
            </Button>
          </div>
        )}
      </div>
    );
  }

  return null;
}
