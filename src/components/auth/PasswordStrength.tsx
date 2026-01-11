import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

type StrengthLevel = "weak" | "fair" | "good" | "strong";

interface StrengthResult {
  level: StrengthLevel;
  score: number;
  label: string;
  color: string;
}

function calculatePasswordStrength(password: string): StrengthResult {
  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Determine level
  let level: StrengthLevel;
  let label: string;
  let color: string;

  if (score <= 2) {
    level = "weak";
    label = "Weak";
    color = "bg-red-500 dark:bg-red-600";
  } else if (score <= 4) {
    level = "fair";
    label = "Fair";
    color = "bg-orange-500 dark:bg-orange-600";
  } else if (score <= 5) {
    level = "good";
    label = "Good";
    color = "bg-yellow-500 dark:bg-yellow-600";
  } else {
    level = "strong";
    label = "Strong";
    color = "bg-green-500 dark:bg-green-600";
  }

  return { level, score, label, color };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  const maxScore = 7;
  const percentage = (strength.score / maxScore) * 100;

  return (
    <div className="space-y-2 mt-2" role="status" aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-600 dark:text-neutral-400">Password strength:</span>
        <span
          className={cn("font-medium", {
            "text-red-600 dark:text-red-500": strength.level === "weak",
            "text-orange-600 dark:text-orange-500": strength.level === "fair",
            "text-yellow-600 dark:text-yellow-500": strength.level === "good",
            "text-green-600 dark:text-green-500": strength.level === "strong",
          })}
        >
          {strength.label}
        </span>
      </div>

      <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
          style={{ width: `${percentage}%` }}
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={maxScore}
        />
      </div>

      <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
        <p>Requirements:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li className={password.length >= 8 ? "text-green-600 dark:text-green-500" : ""}>At least 8 characters</li>
          <li className={/[a-zA-Z]/.test(password) ? "text-green-600 dark:text-green-500" : ""}>Contains a letter</li>
          <li className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-500" : ""}>Contains a number</li>
        </ul>
      </div>
    </div>
  );
}
