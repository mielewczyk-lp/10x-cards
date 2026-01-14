import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ErrorLogDto } from "../../types";

interface LogsTableProps {
  errors: ErrorLogDto[];
  onDelete: (errorLog: ErrorLogDto) => void;
  isLoading: boolean;
}

/**
 * Table component for displaying error logs
 *
 * Features:
 * - Displays error message and created timestamp
 * - Delete action for each log
 * - Responsive design with horizontal scroll on mobile
 * - ARIA labels for accessibility
 */
export function LogsTable({ errors, onDelete, isLoading }: LogsTableProps) {
  /**
   * Format date string
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Empty state
  if (!isLoading && errors.length === 0) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">No error logs found</p>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                Error Message
              </th>
              <th className="text-left px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                Created At
              </th>
              <th className="text-right px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={isLoading ? "opacity-50" : ""}>
            {errors.map((errorLog) => (
              <tr
                key={errorLog.id}
                className="border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
              >
                <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                  <div className="max-w-2xl break-words">{errorLog.errorMessage}</div>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                  {formatDate(errorLog.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(errorLog)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                      aria-label={`Delete error log from ${formatDate(errorLog.createdAt)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
