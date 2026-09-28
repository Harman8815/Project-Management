"use client";

import { Card, ErrorState, LoadingState, Skeleton } from "@/components/ui";
import { useGetAllProjectsDashboardQuery } from "@/state/api";
import { useGetProjectsQuery, useGetAuthUserQuery } from "@/state/api";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setAllProjectsSelected } from "@/state";
import { Clock, AlertCircle, CheckCircle, Target, Zap, Users, BarChart3, Calendar, ChevronRight } from "lucide-react";
import React, { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

const AllProjectsDashboard = () => {
  const dispatch = useAppDispatch();
  const { data: dashboard, isLoading, isError } = useGetAllProjectsDashboardQuery();
  const { data: currentUser } = useGetAuthUserQuery({});

  useEffect(() => {
    dispatch(setAllProjectsSelected(true));
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold dark:text-white">All Projects Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Aggregated view across all your projects</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton className="mt-6" />
        <CardSkeleton className="mt-6" />
      </div>
    );
  }

  if (isError || !dashboard) {
    return <ErrorState message="Failed to load dashboard" onRetry={() => window.location.reload()} />;
  }

  const { 
    totalProjects, 
    activeProjects, 
    totalTasks, 
    completedTasks, 
    inProgressTasks, 
    overdueTasks, 
    upcomingDeadlines, 
    activeSprints, 
    recentActivity, 
    teamWorkload 
  } = dashboard;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold dark:text-white">All Projects Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Aggregated metrics across {totalProjects} projects</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          subtitle={`${activeProjects} active`}
          icon={<BarChart3 className="h-6 w-6 text-blue-500" />}
          trend={`+${totalProjects - activeProjects} archived`}
        />
        <StatCard
          title="Tasks Overview"
          value={totalTasks}
          subtitle={`${completedTasks} completed (${completionRate}%)`}
          icon={<CheckCircle className="h-6 w-6 text-green-500" />}
          trend={`${inProgressTasks} in progress`}
        />
        <StatCard
          title="Overdue Tasks"
          value={overdueTasks}
          subtitle="Requires attention"
          icon={<AlertCircle className="h-6 w-6 text-red-500" />}
          trend={overdueTasks > 0 ? "Action needed" : "All caught up"}
          trendColor="text-red-500"
        />
        <StatCard
          title="Team Workload"
          value={teamWorkload.length}
          subtitle="Active members"
          icon={<Users className="h-6 w-6 text-purple-500" />}
          trend={`${teamWorkload.filter(w => w.hoursUtilization > 100).length} overloaded`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card className="shadow dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Calendar className="h-5 w-5 text-orange-500" />
              </div>
              <h3 className="font-semibold dark:text-white">Upcoming Deadlines (7 days)</h3>
            </div>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No upcoming deadlines</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingDeadlines.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium dark:text-white truncate">{task.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {task.project.key ?? task.projectId}
                      </span>
                      <span>Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Sprints */}
        <Card className="shadow dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="font-semibold dark:text-white">Active Sprints</h3>
            </div>
          </div>
          {activeSprints.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No active sprints</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeSprints.map((sprint) => (
                <div key={sprint.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium dark:text-white truncate">{sprint.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {sprint.project.key ?? sprint.projectId}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity & Team Workload */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="shadow dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Zap className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </div>
              <h3 className="font-semibold dark:text-white">Recent Activity</h3>
            </div>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="p-1.5 rounded bg-gray-100 dark:bg-gray-700">
                    <Clock className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm dark:text-white">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <span>{activity.user?.username ?? "System"}</span>
                      {activity.project && (
                        <>
                          <span>·</span>
                          <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-700">
                            {activity.project.key ?? activity.project.name}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="shadow dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <h3 className="font-semibold dark:text-white">Team Workload</h3>
            </div>
          </div>
          {teamWorkload.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">No workload data</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {teamWorkload.slice(0, 10).map((member) => (
                <div key={member.userId} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium dark:text-white">{member.username}</span>
                    <span className={`text-sm font-medium ${member.hoursUtilization > 100 ? "text-red-500" : member.hoursUtilization > 80 ? "text-amber-500" : "text-green-500"}`}>
                      {member.hoursUtilization}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        member.hoursUtilization > 100 ? "bg-red-500" : member.hoursUtilization > 80 ? "bg-amber-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(member.hoursUtilization, 150)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {member.activeTaskCount} tasks · {member.totalStoryPoints} pts
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendColor = "text-gray-500",
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  trend: string;
  trendColor?: string;
}) {
  return (
    <Card className="shadow dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold dark:text-white mt-1">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">{icon}</div>
      </div>
      <p className={`text-xs mt-3 ${trendColor}`}>{trend}</p>
    </Card>
  );
}

function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <Card className={`shadow dark:border-gray-700 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-1" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </Card>
  );
}

export default AllProjectsDashboard;