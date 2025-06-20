import { Task } from "@/state/api";
import { format } from "date-fns";
import Image from "next/image";
import React from "react";

type Props = {
  task: Task;
};

const TaskCard = ({ task }: Props) => {
  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-md transition hover:shadow-lg dark:border-gray-700 dark:bg-dark-secondary dark:text-gray-100">
      {/* Attachments */}
      {task.attachments?.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            Attachments
          </p>
          <div className="flex flex-wrap gap-3">
            <Image
              src={`/${task.attachments[0].fileURL}`}
              alt={task.attachments[0].fileName}
              width={400}
              height={200}
              className="rounded-md object-cover shadow"
            />
          </div>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-sm">
        <Detail label="ID" value={task.id} />
        <Detail label="Title" value={task.title} />
        <Detail
          label="Description"
          value={task.description || "No description provided"}
        />
        <Detail label="Status" value={task.status} />
        <Detail label="Priority" value={task.priority} />
        <Detail label="Tags" value={task.tags || "No tags"} />
        <Detail
          label="Start Date"
          value={
            task.startDate ? format(new Date(task.startDate), "P") : "Not set"
          }
        />
        <Detail
          label="Due Date"
          value={
            task.dueDate ? format(new Date(task.dueDate), "P") : "Not set"
          }
        />
        <Detail
          label="Author"
          value={task.author?.username || "Unknown"}
        />
        <Detail
          label="Assignee"
          value={task.assignee?.username || "Unassigned"}
        />
      </div>
    </div>
  );
};

// Reusable subcomponent for styling fields
const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col">
    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
      {label}
    </span>
    <span className="text-sm font-medium text-gray-800 dark:text-white">
      {value}
    </span>
  </div>
);

export default TaskCard;
