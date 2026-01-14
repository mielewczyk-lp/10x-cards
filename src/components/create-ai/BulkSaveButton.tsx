import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, Save } from "lucide-react";

interface BulkSaveButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  pendingCount: number;
}

export function BulkSaveButton({ disabled, loading, onClick, pendingCount }: BulkSaveButtonProps) {
  const [showPendingWarning, setShowPendingWarning] = useState(false);

  const handleSaveClick = () => {
    // If there are pending candidates, show warning dialog
    if (pendingCount > 0) {
      setShowPendingWarning(true);
      return;
    }

    // Otherwise, proceed with save
    onClick();
  };

  const handleConfirmSave = () => {
    setShowPendingWarning(false);
    onClick();
  };

  return (
    <>
      <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button onClick={handleSaveClick} disabled={disabled} size="lg" className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save Approved Flashcards
            </>
          )}
        </Button>
      </div>

      <Dialog open={showPendingWarning} onOpenChange={setShowPendingWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              Pending Flashcards Warning
            </DialogTitle>
            <DialogDescription className="text-left">
              You have <strong className="text-neutral-900 dark:text-neutral-100">{pendingCount}</strong> flashcard
              {pendingCount === 1 ? "" : "s"} that {pendingCount === 1 ? "is" : "are"} still pending (not reviewed).
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              <strong>Important:</strong> Pending flashcards will be automatically counted as{" "}
              <strong className="text-red-600 dark:text-red-500">rejected</strong> in your statistics.
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              To include them, please review and approve them before saving. To exclude them, you can explicitly reject
              them or continue with the save.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPendingWarning(false)}>
              Go Back
            </Button>
            <Button onClick={handleConfirmSave}>Continue Anyway</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
