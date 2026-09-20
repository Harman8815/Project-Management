import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = "No data available",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-500" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      {actionLabel && onAction && (
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
