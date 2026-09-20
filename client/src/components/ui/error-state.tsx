import React from "react";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "An error occurred while loading data",
  onRetry,
  retryLabel = "Try Again",
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <AlertCircle className="h-12 w-12 text-red-500" />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      {onRetry && (
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
};
