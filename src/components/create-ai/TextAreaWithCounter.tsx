import { Textarea } from "@/components/ui/textarea";
import { useId } from "react";

interface TextAreaWithCounterProps {
  value: string;
  onChange: (value: string) => void;
  charCount: number;
  error?: string | null;
  disabled?: boolean;
}

export function TextAreaWithCounter({ value, onChange, charCount, error, disabled = false }: TextAreaWithCounterProps) {
  const textareaId = useId();
  const errorId = useId();
  const counterId = useId();

  const getCounterColor = () => {
    if (charCount < 1000) return "text-neutral-400";
    if (charCount > 10000) return "text-red-600 dark:text-red-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="space-y-2">
      <Textarea
        id={textareaId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Paste your learning material here (e.g., lecture notes, article, textbook chapter). AI will generate flashcards from this content. Minimum 1000 characters required."
        className={`min-h-[200px] resize-y ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
        aria-describedby={error ? errorId : counterId}
        aria-invalid={!!error}
      />

      <div className="flex justify-between items-center">
        <div>
          {error && (
            <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          {!error && charCount >= 1000 && charCount <= 10000 && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">✓ Text length is valid</p>
          )}
        </div>

        <p id={counterId} className={`text-sm font-medium ${getCounterColor()}`} aria-live="polite" aria-atomic="true">
          {charCount.toLocaleString()} / 10,000 characters
        </p>
      </div>
    </div>
  );
}
