interface ReviewProgressProps {
  current: number;
  total: number;
  reviewed: number;
}

/**
 * Progress bar showing review session progress
 *
 * Displays:
 * - Current card number / total cards
 * - Total reviewed count
 * - Visual progress bar
 */
export function ReviewProgress({ current, total, reviewed }: ReviewProgressProps) {
  const percentage = total > 0 ? (reviewed / total) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>
          Card {current} of {total}
        </span>
        <span>{reviewed} reviewed</span>
      </div>

      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={reviewed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`Review progress: ${reviewed} of ${total} cards reviewed`}
        />
      </div>
    </div>
  );
}
