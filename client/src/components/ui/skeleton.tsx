import React from "react";
import SkeletonDefault, { SkeletonProps } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const skeletonColors = {
  light: { highlight: "#e5e7eb", base: "#f3f4f6" },
  dark: { highlight: "#374151", base: "#1f2937" },
};

const isDarkMode = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const baseColors = isDarkMode()
  ? { base: skeletonColors.dark.base, highlight: skeletonColors.dark.highlight }
  : { base: skeletonColors.light.base, highlight: skeletonColors.light.highlight };

export { baseColors as skeletonBaseColors };

export const Skeleton: React.FC<SkeletonProps> = (props) => {
  return <SkeletonDefault {...props} baseColor={baseColors.base} highlightColor={baseColors.highlight} />;
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4,
}) => {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
      <div className="bg-gray-100 dark:bg-gray-800 p-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-gray-200 p-3 dark:border-gray-700">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-3 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
};

export type { SkeletonProps };
