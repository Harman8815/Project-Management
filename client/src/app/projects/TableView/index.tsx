import { useAppSelector } from "@/app/redux";
import Header from "@/components/Header";
import { Button, ErrorState, LoadingState, Badge } from "@/components/ui";
import { dataGridClassNames, dataGridSxStyles } from "@/lib/utils";
import { useGetTasksQuery } from "@/state/api";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import React from "react";

type Props = {
  id: string;
  setIsModalNewTaskOpen: (isOpen: boolean) => void;
};

const columns: GridColDef[] = [
  { field: "title", headerName: "Title", width: 200 },
  { field: "description", headerName: "Description", width: 200 },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (params) => (
      <Badge variant="success" size="sm">
        {params.value}
      </Badge>
    ),
  },
  { field: "priority", headerName: "Priority", width: 100 },
  { field: "tags", headerName: "Tags", width: 130 },
  { field: "startDate", headerName: "Start Date", width: 130 },
  { field: "dueDate", headerName: "Due Date", width: 130 },
  {
    field: "author",
    headerName: "Author",
    width: 150,
    renderCell: (params) => params.value?.username || "Unknown",
  },
  {
    field: "assignee",
    headerName: "Assignee",
    width: 150,
    renderCell: (params) => params.value?.username || "Unassigned",
  },
];

const TableView = ({ id, setIsModalNewTaskOpen }: Props) => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const {
    data: tasks,
    error,
    isLoading,
  } = useGetTasksQuery({ projectId: Number(id) });

  if (isLoading) return <LoadingState message="Loading tasks..." />;
  if (error || !tasks)
    return (
      <ErrorState
        message="Failed to load tasks"
        onRetry={() => window.location.reload()}
      />
    );

  return (
    <div className="h-[540px] w-full px-4 pb-8 xl:px-6">
      <div className="pt-5">
        <Header
          name="Table"
          buttonComponent={
            <Button
              variant="primary"
              onClick={() => setIsModalNewTaskOpen(true)}
            >
              Add Task
            </Button>
          }
          isSmallText
        />
      </div>
      <DataGrid
        rows={tasks || []}
        columns={columns}
        getRowId={(row) => row.id}
        className={dataGridClassNames}
        sx={dataGridSxStyles(isDarkMode)}
      />
    </div>
  );
};

export default TableView;
