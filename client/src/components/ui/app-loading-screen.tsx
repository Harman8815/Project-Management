import React from "react";
import { Loader2 } from "lucide-react";

interface AppLoadingScreenProps {
  message?: string;
}

export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  message = "Loading ProjeX...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-white dark:bg-dark-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-30"></div>
          <div className="relative rounded-full bg-blue-600 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {message}
        </p>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>
      </div>
    </div>
  );
};
