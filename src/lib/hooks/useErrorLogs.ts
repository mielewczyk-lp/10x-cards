import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { ErrorLogDto } from "../../types";

interface UseErrorLogsReturn {
  errors: ErrorLogDto[];
  isLoading: boolean;
  error: string | null;
  deleteErrorLog: (id: string) => Promise<void>;
}

/**
 * Custom hook for managing error logs
 *
 * Features:
 * - Fetches error logs from API
 * - Handles delete operations
 * - Provides loading and error states
 * - Toast notifications for user feedback
 */
export function useErrorLogs(): UseErrorLogsReturn {
  const [errors, setErrors] = useState<ErrorLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch error logs from API
   */
  const fetchErrorLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/generation-sources/errors");

      if (!response.ok) {
        throw new Error("Failed to fetch error logs");
      }

      const data = await response.json();
      setErrors(data.errors ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch error logs";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete an error log
   */
  const deleteErrorLog = async (id: string) => {
    try {
      const response = await fetch(`/api/generation-sources/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to delete error log");
      }

      // Remove from local state
      setErrors((prev) => prev.filter((log) => log.id !== id));
      toast.success("Error log deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete error log";
      toast.error(message);
      throw err;
    }
  };

  // Fetch error logs on mount
  useEffect(() => {
    fetchErrorLogs();
  }, []);

  return {
    errors,
    isLoading,
    error,
    deleteErrorLog,
  };
}
