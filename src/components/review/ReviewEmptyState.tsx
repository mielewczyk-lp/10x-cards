import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface ReviewEmptyStateProps {
  onNavigateToFlashcards?: () => void;
}

/**
 * Empty state component shown when no flashcards are available for review
 *
 * Displays:
 * - Success message
 * - Encouragement to come back later
 * - Optional navigation to flashcards list
 */
export function ReviewEmptyState({ onNavigateToFlashcards }: ReviewEmptyStateProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">All Caught Up!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500" aria-hidden="true" />
          <p className="text-center text-muted-foreground max-w-md">
            You've reviewed all your flashcards for now. Come back later when more cards are due for review.
          </p>
        </div>

        {onNavigateToFlashcards && (
          <div className="flex justify-center">
            <Button onClick={onNavigateToFlashcards} variant="outline" size="lg">
              View All Flashcards
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
