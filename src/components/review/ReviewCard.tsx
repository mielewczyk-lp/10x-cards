import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReviewSessionFlashcardDto } from "@/types";

interface ReviewCardProps {
  flashcard: ReviewSessionFlashcardDto;
  onShowAnswer: () => void;
}

/**
 * Card component for displaying a flashcard during review session
 *
 * Features:
 * - Shows front side initially
 * - Flips to show back side when user clicks "Show Answer"
 * - Displays SM-2 state information (for debugging/transparency)
 */
export function ReviewCard({ flashcard, onShowAnswer }: ReviewCardProps) {
  const [showBack, setShowBack] = useState(false);

  const handleShowAnswer = () => {
    setShowBack(true);
    onShowAnswer();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto" data-testid="review-card">
      <CardHeader>
        <CardTitle className="text-center text-lg font-medium" data-testid="review-card-title">
          {showBack ? "Answer" : "Question"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="min-h-[200px] flex items-center justify-center p-6 bg-muted rounded-lg">
          <p className="text-xl text-center whitespace-pre-wrap" data-testid="review-card-content">
            {showBack ? flashcard.back : flashcard.front}
          </p>
        </div>

        {!showBack && (
          <div className="flex justify-center">
            <Button onClick={handleShowAnswer} size="lg" className="w-full max-w-xs" data-testid="show-answer-button">
              Show Answer
            </Button>
          </div>
        )}

        {/* SM-2 State Info (optional, for transparency) */}
        {showBack && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Repetition: {flashcard.sm2State.repetition}</p>
            <p>Interval: {flashcard.sm2State.interval} days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
