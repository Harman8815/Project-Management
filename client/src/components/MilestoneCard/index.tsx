import React from "react";
import { Badge } from "@/components/ui";

interface MilestoneCardProps {
  milestone: {
    id: number;
    name: string;
    description?: string;
    startDate?: string;
    dueDate?: string;
    status: string;
    completionRate?: number;
    totalTasks?: number;
    completedTasks?: number;
  };
  onUpdateStatus?: (id: number, status: string) => void;
}

const MilestoneCard = ({ milestone, onUpdateStatus }: MilestoneCardProps) => {
  const statusColors: Record<string, string> = {
    PLANNED: "bg-gray-100 text-gray-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 100) return "bg-green-500";
    if (rate >= 75) return "bg-blue-500";
    if (rate >= 50) return "bg-yellow-500";
    return "bg-gray-300";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{milestone.name}</h3>
          {milestone.description && (
            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
          )}
        </div>
        <Badge className={statusColors[milestone.status] || "bg-gray-100 text-gray-800"}>
          {milestone.status}
        </Badge>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">
            {milestone.completedTasks || 0} / {milestone.totalTasks || 0} tasks
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressBarColor(milestone.completionRate || 0)}`}
            style={{ width: `${milestone.completionRate || 0}%` }}
          />
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">
          {milestone.completionRate || 0}% complete
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Start Date</p>
          <p className="font-medium">{formatDate(milestone.startDate)}</p>
        </div>
        <div>
          <p className="text-gray-500">Due Date</p>
          <p className="font-medium">{formatDate(milestone.dueDate)}</p>
        </div>
      </div>

      {onUpdateStatus && (
        <div className="mt-4 pt-4 border-t">
          <select
            value={milestone.status}
            onChange={(e) => onUpdateStatus(milestone.id, e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default MilestoneCard;