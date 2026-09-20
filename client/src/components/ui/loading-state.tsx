import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8">
      <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};
