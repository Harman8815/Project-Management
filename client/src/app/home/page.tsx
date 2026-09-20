"use client";

import {
  Priority,
  Project,
  Task,
  useGetProjectsQuery,
  useGetTasksQuery,
} from "@/state/api";
import React from "react";
import { useAppSelector } from "../redux";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Header from "@/components/Header";
import { Card, LoadingState, EmptyState, ErrorState } from "@/components/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dataGridClassNames, dataGridSxStyles } from "@/lib/utils";

const taskColumns: GridColDef[] = [
  { field: "title", headerName: "Title", width: 200 },
  { field: "status", headerName: "Status", width: 150 },
  { field: "priority", headerName: "Priority", width: 150 },
  { field: "dueDate", headerName: "Due Date", width: 150 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const HomePage = () => {
  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useGetTasksQuery({ projectId: 1 });
  const {
    data: projects,
    isLoading: isProjectsLoading,
    isError: projectsError,
  } = useGetProjectsQuery();

  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);

  if (tasksLoading || isProjectsLoading)
    return <LoadingState message="Loading dashboard..." />;
  if (tasksError || projectsError)
    return (
      <ErrorState
        message="Failed to load dashboard data"
        onRetry={() => window.location.reload()}
      />
    );

  const tasksList = tasks || [];
  const projectsList = projects || [];

  const priorityCount = tasksList.reduce(
    (acc: Record<string, number>, task: Task) => {
      const { priority } = task;
      acc[priority as Priority] = (acc[priority as Priority] || 0) + 1;
      return acc;
    },
    {},
  );

  const taskDistribution = Object.keys(priorityCount).map((key) => ({
    name: key,
    count: priorityCount[key],
  }));

  const statusCount = projectsList.reduce(
    (acc: Record<string, number>, project: Project) => {
      const status = project.endDate ? "Completed" : "Active";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {},
  );

  const projectStatus = Object.keys(statusCount).map((key) => ({
    name: key,
    count: statusCount[key],
  }));

  const chartColors = isDarkMode
    ? {
        bar: "#8884d8",
        barGrid: "#303030",
        pieFill: "#4A90E2",
        text: "#FFFFFF",
      }
    : {
        bar: "#8884d8",
        barGrid: "#E0E0E0",
        pieFill: "#82ca9d",
        text: "#000000",
      };

  if (tasksList.length === 0 && projectsList.length === 0) {
    return <EmptyState message="No tasks or projects found" />;
  }

  return (
    <div className="container h-full w-full bg-gray-100 p-8 dark:bg-dark-bg">
      <Header name="Project Management Dashboard" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card
          title="Task Priority Distribution"
          className="shadow dark:border-gray-700"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.barGrid}
              />
              <XAxis dataKey="name" stroke={chartColors.text} />
              <YAxis stroke={chartColors.text} />
              <Tooltip
                contentStyle={{
                  width: "min-content",
                  height: "min-content",
                }}
              />
              <Legend />
              <Bar dataKey="count" fill={chartColors.bar} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Project Status" className="shadow dark:border-gray-700">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie dataKey="count" data={projectStatus} fill={chartColors.pieFill} label>
                {projectStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card
          title="Your Tasks"
          className="md:col-span-2 shadow dark:border-gray-700"
        >
          <div style={{ height: 400, width: "100%" }}>
            <DataGrid
              rows={tasksList}
              columns={taskColumns}
              checkboxSelection
              getRowId={(row) => row.id}
              className={dataGridClassNames}
              sx={dataGridSxStyles(isDarkMode)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
