"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clock, Target, CheckCircle, AlertCircle, Zap, Flag } from "lucide-react";
import React from "react";

interface SprintLifecycleProps {
  sprint: {
    id: number;
    name: string;
    status: string;
    startDate?: string;
    endDate?: string;
    goal?: string;
    projectId: number;
  };
  compact?: boolean;
  onStatusChange?: (sprintId: number, status: string) => void;
}

const LIFECYCLE_STAGES = [
  { key: "PLANNED", label: "Planned", icon: Target, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-700" },
  { key: "UPCOMING", label: "Upcoming", icon: Clock, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { key: "ACTIVE", label: "Active", icon: Zap, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
  { key: "NEAR_COMPLETION", label: "Near Completion", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30" },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  { key: "CLOSED", label: "Closed", icon: Flag, color: "text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" },
];

const SprintLifecycle = ({ sprint, compact = false, onStatusChange }: SprintLifecycleProps) => {
  const currentIndex = LIFECYCLE_STAGES.findIndex((s) => s.key === sprint.status);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / LIFECYCLE_STAGES.length) * 100 : 0;

  const getDaysRemaining = () => {
    if (!sprint.endDate) return null;
    const end = new Date(sprint.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysRemaining = getDaysRemaining();
  const isNearCompletion = daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && sprint.status === "ACTIVE";
  const isOverdue = daysRemaining !== null && daysRemaining < 0 && sprint.status !== "COMPLETED" && sprint.status !== "CLOSED";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {LIFECYCLE_STAGES.slice(0, currentIndex + 1).map((stage, index) => (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-1 px-2 py-1 rounded ${stage.bg} ${stage.color}`}
            >
              <stage.icon className="h-3 w-3" />
              <span className="text-xs font-medium">{stage.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {currentIndex < LIFECYCLE_STAGES.length - 1 && (
          <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-emerald-500 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          {LIFECYCLE_STAGES.map((stage, index) => (
            <span key={stage.key} className={`flex items-center gap-1 ${index === currentIndex ? "font-medium dark:text-white" : ""}`}>
              <stage.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{stage.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Stage Details */}
      <div className="space-y-3">
        {LIFECYCLE_STAGES.map((stage, index) => {
          const isCurrent = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                isCurrent ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" :
                isCompleted ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" :
                "bg-gray-50 dark:bg-gray-700/50"
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${stage.bg} ${stage.color}`}>
                <stage.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium dark:text-white">{stage.label}</span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      Current
                    </span>
                  )}
                  {isCompleted && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                      Done
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {sprint.startDate && (
                      <p>Started: {new Date(sprint.startDate).toLocaleDateString()}</p>
                    )}
                    {sprint.endDate && (
                      <p>
                        Ends: {new Date(sprint.endDate).toLocaleDateString()}
                        {daysRemaining !== null && (
                          <span className={`ml-2 ${isOverdue ? "text-red-500" : isNearCompletion ? "text-amber-500" : "text-gray-500"}`}>
                            {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : daysRemaining === 0 ? "Ends today" : `${daysRemaining} days remaining`}
                          </span>
                        )}
                      </p>
                    )}
                    {sprint.goal && <p className="text-gray-600 dark:text-gray-400 italic">&quot;{sprint.goal}&quot;</p>}
                    {onStatusChange && index < LIFECYCLE_STAGES.length - 1 && (
                      <button
                        onClick={() => onStatusChange(sprint.id, LIFECYCLE_STAGES[index + 1].key)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        Move to {LIFECYCLE_STAGES[index + 1].label} →
                      </button>
                    )}
                  </div>
                )}
                {isCompleted && sprint.endDate && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Completed on {new Date(sprint.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0">
                {isCurrent && (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-blue-500"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.div>
                )}
                {isCompleted && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Status Override */}
      {onStatusChange && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium dark:text-white mb-2">Override Status</label>
          <select
            className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={sprint.status}
            onChange={(e) => onStatusChange(sprint.id, e.target.value)}
          >
            {LIFECYCLE_STAGES.map((stage) => (
              <option key={stage.key} value={stage.key}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default SprintLifecycle;