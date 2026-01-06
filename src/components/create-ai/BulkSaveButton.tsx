import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

interface BulkSaveButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export function BulkSaveButton({ disabled, loading, onClick }: BulkSaveButtonProps) {
  return (
    <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <Button onClick={onClick} disabled={disabled} size="lg" className="w-full sm:w-auto">
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
  );
}
