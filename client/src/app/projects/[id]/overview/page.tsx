"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useGetProjectsQuery, useGetTasksQuery } from "@/state/api";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui";
import ProjectHeader from "../../ProjectHeader";

type TabType = "overview" | "tasks" | "milestones" | "activity" | "settings";

const ProjectOverview = () => {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { data: projects } = useGetProjectsQuery();
  const { data: tasks } = useGetTasksQuery({ projectId: Number(id) });
  
  const projectName =
    projects?.find((p) => p.id === Number(id))?.name ?? "Project";

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: projectName },
    { label: "Overview" },
  ];

  const taskStats = {
    total: tasks?.length || 0,
    completed: tasks?.filter(t => t.status === "COMPLETED").length || 0,
    inProgress: tasks?.filter(t => t.status === "IN_PROGRESS").length || 0,
    todo: tasks?.filter(t => t.status === "TODO").length || 0,
  };

  return (
    <div>
      <div className="p-4">
        <Breadcrumbs items={breadcrumbItems} />
        <ProjectHeader
          activeTab="Overview"
          setActiveTab={() => {}}
          projectName={projectName}
        />
        
        {/* Tab Navigation */}
        <div className="flex border-b mb-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "tasks", label: "Tasks" },
            { id: "milestones", label: "Milestones" },
            { id: "activity", label: "Activity" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Project Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 text-sm font-medium">Total Tasks</h3>
                  <p className="text-3xl font-bold mt-2">{taskStats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
                  <p className="text-3xl font-bold mt-2 text-green-600">{taskStats.completed}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 text-sm font-medium">In Progress</h3>
                  <p className="text-3xl font-bold mt-2 text-blue-600">{taskStats.inProgress}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 text-sm font-medium">To Do</h3>
                  <p className="text-3xl font-bold mt-2 text-gray-600">{taskStats.todo}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="text-gray-500 text-center py-8">
                    No recent activity
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">All Tasks</h3>
              <div className="space-y-3">
                {tasks?.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
                {tasks?.length === 0 && (
                  <div className="text-gray-500 text-center py-8">
                    No tasks yet
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "milestones" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Milestones</h3>
                <Button variant="primary" size="sm">
                  Add Milestone
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-gray-500 text-center py-8 col-span-2">
                  No milestones yet
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
              <div className="text-gray-500 text-center py-8">
                No activity yet
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Project Settings</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Project Information</h4>
                  <p className="text-gray-500 text-sm">Manage project details and configuration</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <p className="text-gray-500 text-sm">Configure access control and roles</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Danger Zone</h4>
                  <Button variant="danger" size="sm">
                    Archive Project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;