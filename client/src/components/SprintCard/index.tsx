import React from "react";
import { Badge } from "@/components/ui";

interface SprintCardProps {
  sprint: {
    id: number;
    name: string;
    goal?: string;
    startDate?: string;
    endDate?: string;
    status: string;
    capacity?: number;
    totalTasks?: number;
    completedPoints?: number;
    totalPoints?: number;
    completionRate?: number;
  };
  onUpdateStatus?: (id: number, status: string) => void;
}

const SprintCard = ({ sprint, onUpdateStatus }: SprintCardProps) => {
  const statusColors: Record<string, string> = {
    PLANNED: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
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

  const calculateDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining(sprint.endDate);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{sprint.name}</h3>
          {sprint.goal && (
            <p className="text-sm text-gray-500 mt-1">{sprint.goal}</p>
          )}
        </div>
        <Badge className={statusColors[sprint.status] || "bg-gray-100 text-gray-800"}>
          {sprint.status}
        </Badge>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Sprint Progress</span>
          <span className="font-medium">
            {sprint.completedPoints || 0} / {sprint.totalPoints || 0} points
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressBarColor(sprint.completionRate || 0)}`}
            style={{ width: `${sprint.completionRate || 0}%` }}
          />
        </div>
        <p className="text-right text-sm text-gray-500 mt-1">
          {sprint.completionRate || 0}% complete
        </p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-gray-500">Start Date</p>
          <p className="font-medium">{formatDate(sprint.startDate)}</p>
        </div>
        <div>
          <p className="text-gray-500">End Date</p>
          <p className="font-medium">{formatDate(sprint.endDate)}</p>
        </div>
      </div>

      {/* Capacity */}
      {sprint.capacity && (
        <div className="mb-4">
          <p className="text-gray-500 text-sm">Capacity</p>
          <p className="font-medium">{sprint.capacity} story points</p>
        </div>
      )}

      {/* Days Remaining */}
      {daysRemaining !== null && (
        <div className="mb-4">
          <p className="text-gray-500 text-sm">Days Remaining</p>
          <p className={`font-medium ${daysRemaining < 0 ? "text-red-600" : daysRemaining <= 3 ? "text-yellow-600" : "text-green-600"}`}>
            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
          </p>
        </div>
      )}

      {/* Task Count */}
      <div className="mb-4">
        <p className="text-gray-500 text-sm">Tasks</p>
        <p className="font-medium">{sprint.totalTasks || 0} tasks in sprint</p>
      </div>

      {onUpdateStatus && (
        <div className="pt-4 border-t">
          <select
            value={sprint.status}
            onChange={(e) => onUpdateStatus(sprint.id, e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default SprintCard;