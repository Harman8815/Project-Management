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

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton height={20} width={120} />
        <Skeleton height={16} width={16} />
      </div>
      <Skeleton height={16} width="100%" className="mb-2" />
      <Skeleton height={16} width="80%" className="mb-4" />
      <div className="mt-4 flex gap-2">
        <Skeleton height={24} width={24} circle />
        <Skeleton height={14} width={60} />
      </div>
    </div>
  );
}

export function ProjectListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </>
  );
}

export function TimelineRowSkeleton({ hasSprints = true }: { hasSprints?: boolean }) {
  return (
    <div className="border-b border-gray-200 p-4 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton height={24} width={24} />
          <Skeleton height={16} width={120} />
        </div>
        <Skeleton height={16} width={80} />
      </div>
      {hasSprints && (
        <div className="ml-6 mt-2 space-y-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded bg-gray-50 p-2 dark:bg-gray-800">
              <Skeleton height={14} width={100} />
              <Skeleton height={12} width={80} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TimelineRowSkeleton key={i} />
      ))}
    </>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between">
        <Skeleton height={16} width={120} />
        <Skeleton height={12} width={60} />
      </div>
      <Skeleton height={14} width="100%" className="mb-1" />
      <Skeleton height={14} width="90%" className="mb-1" />
      <div className="mt-3 flex gap-2">
        <Skeleton height={20} width={20} circle />
        <Skeleton height={12} width={50} />
      </div>
    </div>
  );
}

export function TaskListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton height={12} width={60} className="mb-2" />
          <Skeleton height={24} width={40} className="mb-1" />
          <Skeleton height={12} width={80} />
        </div>
        <Skeleton height={24} width={24} />
      </div>
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
