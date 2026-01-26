import { useMemo } from "react";
import type { FlashcardCandidate } from "@/lib/hooks/useAiGenerationFlow";
import { CandidateItem } from "./CandidateItem";

interface CandidateListProps {
  candidates: FlashcardCandidate[];
  onUpdateCandidate: (id: string, updates: Partial<FlashcardCandidate>) => void;
}

export function CandidateList({ candidates, onUpdateCandidate }: CandidateListProps) {
  // For future optimization: implement virtualization if N > 50
  const shouldVirtualize = useMemo(() => candidates.length > 50, [candidates.length]);

  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Generated Flashcards ({candidates.length})
      </h2>

      {shouldVirtualize && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Showing {candidates.length} candidates</p>
      )}

      <ul className="space-y-3">
        {candidates.map((candidate) => (
          <li key={candidate.id}>
            <CandidateItem candidate={candidate} onUpdateCandidate={onUpdateCandidate} />
          </li>
        ))}
      </ul>
    </div>
  );
}
