import { useState, useCallback } from "react";
import type { FlashcardCandidate } from "@/lib/hooks/useAiGenerationFlow";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Edit3, XCircle } from "lucide-react";
import { EditCandidateModal } from "./EditCandidateModal";

interface CandidateItemProps {
  candidate: FlashcardCandidate;
  onUpdateCandidate: (id: string, updates: Partial<FlashcardCandidate>) => void;
}

export function CandidateItem({ candidate, onUpdateCandidate }: CandidateItemProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleAccept = useCallback(() => {
    onUpdateCandidate(candidate.id, { status: "accepted" });
  }, [candidate.id, onUpdateCandidate]);

  const handleReject = useCallback(() => {
    onUpdateCandidate(candidate.id, { status: "rejected" });
  }, [candidate.id, onUpdateCandidate]);

  const handleEdit = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const handleSaveEdit = useCallback(
    (front: string, back: string) => {
      onUpdateCandidate(candidate.id, {
        status: "edited",
        front,
        back,
      });
      setIsEditModalOpen(false);
    },
    [candidate.id, onUpdateCandidate]
  );

  const getStatusBadge = () => {
    switch (candidate.status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        );
      case "edited":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Edit3 className="mr-1 h-3 w-3" />
            Edited
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
    }
  };

  const isRejected = candidate.status === "rejected";

  return (
    <>
      <Card className={`${isRejected ? "opacity-50 border-red-200 dark:border-red-900" : ""}`}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Front</h3>
            {getStatusBadge()}
          </div>

          <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{candidate.front}</p>

          <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Back</h3>
          <p className="text-base text-neutral-700 dark:text-neutral-300">{candidate.back}</p>
        </CardContent>

        <CardFooter className="flex gap-2 justify-end border-t border-neutral-200 dark:border-neutral-800 pt-4">
          {candidate.status === "rejected" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAccept}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Undo Reject
            </Button>
          ) : (
            <>
              {candidate.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAccept}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Accept
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit3 className="mr-1 h-4 w-4" />
                Edit
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReject}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <EditCandidateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        candidate={candidate}
        onSave={handleSaveEdit}
      />
    </>
  );
}
