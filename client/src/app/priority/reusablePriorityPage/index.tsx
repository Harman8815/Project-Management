"use client";

import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import { Button, EmptyState, LoadingState } from "@/components/ui";
import TaskCard from "@/components/TaskCard";
import ModalNewTask from "@/components/ModalNewTask";
import { dataGridClassNames, dataGridSxStyles } from "@/lib/utils";
import {
  Priority,
  Task,
  useGetAuthUserQuery,
  useGetTasksByUserQuery,
} from "@/state/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React, { useState } from "react";

const columns: GridColDef[] = [
  { field: "title", headerName: "Title", width: 100 },
  { field: "description", headerName: "Description", width: 200 },
  { field: "status", headerName: "Status", width: 130 },
  { field: "priority", headerName: "Priority", width: 75 },
  { field: "tags", headerName: "Tags", width: 130 },
  { field: "startDate", headerName: "Start Date", width: 130 },
  { field: "dueDate", headerName: "Due Date", width: 130 },
  {
    field: "author",
    headerName: "Author",
    width: 150,
    renderCell: (params) => params.value.username || "Unknown",
  },
  {
    field: "assignee",
    headerName: "Assignee",
    width: 150,
    renderCell: (params) => params.value.username || "Unassigned",
  },
];

const ReusablePriorityPage = ({ priority }: { priority: Priority }) => {
  const [view, setView] = useState("list");
  const [isModalNewTaskOpen, setIsModalNewTaskOpen] = useState(false);

  const { data: currentUser } = useGetAuthUserQuery({});
  const userId = 3;
  const {
    data: tasks,
    isLoading,
    isError: isTasksError,
  } = useGetTasksByUserQuery(userId || 0, {
    skip: userId === null,
  });

  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const filteredTasks =
    tasks?.filter((task: Task) => task.priority === priority) ?? [];

  if (isTasksError) {
    return <EmptyState message="Could not load tasks" />;
  }

  return (
    <div className="m-5 p-4">
      <ModalNewTask
        isOpen={isModalNewTaskOpen}
        onClose={() => setIsModalNewTaskOpen(false)}
      />
      <Header
        name="Priority Page"
        buttonComponent={
          <Button
            variant="primary"
            className="mr-3"
            onClick={() => setIsModalNewTaskOpen(true)}
          >
            Add Task
          </Button>
        }
      />
      <div className="mb-4 flex justify-start gap-2">
        <Button
          variant={view === "list" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setView("list")}
        >
          List
        </Button>
        <Button
          variant={view === "table" ? "secondary" : "outline"}
          size="sm"
          onClick={() => setView("table")}
        >
          Table
        </Button>
      </div>
      {isLoading ? (
        <LoadingState message="Loading tasks..." />
      ) : view === "list" ? (
        filteredTasks.length === 0 ? (
          <EmptyState message="No tasks found for this priority" />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTasks?.map((task: Task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )
      ) : (
        view === "table" &&
        filteredTasks && (
          <div className="z-0 w-full">
            <DataGrid
              rows={filteredTasks}
              columns={columns}
              checkboxSelection
              getRowId={(row) => row.id}
              className={dataGridClassNames}
              sx={dataGridSxStyles(isDarkMode)}
            />
          </div>
        )
      )}
    </div>
  );
};

export default ReusablePriorityPage;
