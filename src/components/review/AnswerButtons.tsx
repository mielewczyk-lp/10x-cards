import { Button } from "@/components/ui/button";

interface AnswerButtonsProps {
  onAnswer: (grade: number) => void;
  disabled?: boolean;
}

/**
 * Button group for rating flashcard recall quality
 *
 * Maps user-friendly labels to SM-2 grades:
 * - Again: 0 (complete blackout)
 * - Hard: 2 (incorrect response; correct one remembered)
 * - Good: 4 (correct response with hesitation)
 * - Easy: 5 (perfect response)
 */
export function AnswerButtons({ onAnswer, disabled = false }: AnswerButtonsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mx-auto">
      <Button
        onClick={() => onAnswer(0)}
        disabled={disabled}
        variant="destructive"
        size="lg"
        className="w-full"
        aria-label="Again - I forgot completely"
      >
        <span className="flex flex-col items-center gap-1">
          <span className="font-semibold">Again</span>
          <span className="text-xs opacity-80">&lt;1m</span>
        </span>
      </Button>

      <Button
        onClick={() => onAnswer(2)}
        disabled={disabled}
        variant="outline"
        size="lg"
        className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-950"
        aria-label="Hard - I barely remembered"
      >
        <span className="flex flex-col items-center gap-1">
          <span className="font-semibold">Hard</span>
          <span className="text-xs opacity-80">&lt;6m</span>
        </span>
      </Button>

      <Button
        onClick={() => onAnswer(4)}
        disabled={disabled}
        variant="outline"
        size="lg"
        className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-950"
        aria-label="Good - I remembered correctly"
      >
        <span className="flex flex-col items-center gap-1">
          <span className="font-semibold">Good</span>
          <span className="text-xs opacity-80">&lt;10m</span>
        </span>
      </Button>

      <Button
        onClick={() => onAnswer(5)}
        disabled={disabled}
        variant="outline"
        size="lg"
        className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-950"
        aria-label="Easy - I remembered perfectly"
      >
        <span className="flex flex-col items-center gap-1">
          <span className="font-semibold">Easy</span>
          <span className="text-xs opacity-80">&gt;1d</span>
        </span>
      </Button>
    </div>
  );
}
