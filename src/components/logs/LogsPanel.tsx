import { useState } from "react";
import { useErrorLogs } from "@/lib/hooks/useErrorLogs";
import { LogsTable } from "./LogsTable";
import { DeleteErrorLogDialog } from "./DeleteErrorLogDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import type { ErrorLogDto } from "../../types";

/**
 * Main panel component for error logs view
 *
 * Orchestrates:
 * - Table display with error logs
 * - Delete confirmation dialog
 * - Loading and error states
 */
export default function LogsPanel() {
  const { errors, isLoading, error, deleteErrorLog } = useErrorLogs();

  // Dialog state
  const [deletingErrorLog, setDeletingErrorLog] = useState<ErrorLogDto | null>(null);

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (errorLog: ErrorLogDto) => {
    setDeletingErrorLog(errorLog);
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!deletingErrorLog) return;

    try {
      await deleteErrorLog(deletingErrorLog.id);
      setDeletingErrorLog(null);
    } catch (err) {
      // Error is already handled in the hook
      // Dialog will stay open to let user retry
    }
  };

  /**
   * Handle delete cancel
   */
  const handleDeleteCancel = () => {
    setDeletingErrorLog(null);
  };

  return (
    <div className="space-y-6">
      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && errors.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading error logs...</span>
        </div>
      )}

      {/* Table or empty state */}
      {!isLoading && <LogsTable errors={errors} onDelete={handleDeleteClick} isLoading={false} />}

      {/* Delete confirmation dialog */}
      {deletingErrorLog && (
        <DeleteErrorLogDialog
          errorLog={deletingErrorLog}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
