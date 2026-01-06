import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Edit3, XCircle, FileText, Clock } from "lucide-react";

interface StatusBarProps {
  stats: {
    total: number;
    pending: number;
    accepted: number;
    edited: number;
    rejected: number;
  };
}

export function StatusBar({ stats }: StatusBarProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-neutral-500" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Total:</span>
        <Badge variant="secondary">{stats.total}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-neutral-500" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Pending:</span>
        <Badge variant="secondary">{stats.pending}</Badge>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Accepted:</span>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
          {stats.accepted}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Edited:</span>
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100">
          {stats.edited}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Rejected:</span>
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100">
          {stats.rejected}
        </Badge>
      </div>
    </div>
  );
}
