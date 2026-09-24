import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Textarea, Select } from "@/components/ui";
import Modal from "@/components/Modal";
import { useCreateTaskMutation, useUpdateTaskMutation, Priority, Status, Task } from "@/state/api";
import { formatISO } from "date-fns";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
  projectId?: number;
  task?: Task | null;
};

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.nativeEnum(Status),
  priority: z.nativeEnum(Priority),
  tags: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  authorUserId: z.coerce.number({ required_error: "Author User ID is required" }),
  assignedUserId: z.coerce.number().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskForm = ({ isOpen, onClose, id = null, projectId, task = null }: Props) => {
  const isEditMode = task !== null;

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      status: task?.status ?? Status.ToDo,
      priority: task?.priority ?? Priority.Backlog,
      tags: task?.tags ?? "",
      startDate: task?.startDate ? task.startDate.slice(0, 10) : "",
      dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
      authorUserId: task?.authorUserId ?? undefined,
      assignedUserId: task?.assignedUserId ?? undefined,
    },
  });

  useEffect(() => {
    if (task) {
      setValue("title", task.title);
      setValue("description", task.description ?? "");
      setValue("status", task.status ?? Status.ToDo);
      setValue("priority", task.priority ?? Priority.Backlog);
      setValue("tags", task.tags ?? "");
      setValue("startDate", task.startDate ? task.startDate.slice(0, 10) : "");
      setValue("dueDate", task.dueDate ? task.dueDate.slice(0, 10) : "");
      setValue("authorUserId", task.authorUserId ?? 0);
      setValue("assignedUserId", task.assignedUserId ?? undefined);
    }
  }, [task, setValue]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        tags: data.tags,
        startDate: data.startDate ? formatISO(new Date(data.startDate), { representation: "complete" }) : undefined,
        dueDate: data.dueDate ? formatISO(new Date(data.dueDate), { representation: "complete" }) : undefined,
        authorUserId: data.authorUserId,
        assignedUserId: data.assignedUserId,
        projectId: isEditMode ? undefined : projectId ?? (id !== null ? Number(id) : undefined),
      };

      if (isEditMode && task) {
        await updateTask({ id: task.id, updates: payload }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }

      onClose();
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name={isEditMode ? "Edit Task" : "Create New Task"}>
      <form
        className="mt-4 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }}
      >
        <Input
          label="Title"
          placeholder="Task title"
          error={errors.title?.message}
          {...register("title")}
        />
        <Textarea
          label="Description"
          placeholder="Task description"
          error={errors.description?.message}
          {...register("description")}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <Select
            label="Status"
            error={errors.status?.message}
            {...register("status")}
          >
            <option value={Status.ToDo}>To Do</option>
            <option value={Status.WorkInProgress}>Work In Progress</option>
            <option value={Status.UnderReview}>Under Review</option>
            <option value={Status.Completed}>Completed</option>
          </Select>
          <Select
            label="Priority"
            error={errors.priority?.message}
            {...register("priority")}
          >
            <option value={Priority.Urgent}>Urgent</option>
            <option value={Priority.High}>High</option>
            <option value={Priority.Medium}>Medium</option>
            <option value={Priority.Low}>Low</option>
            <option value={Priority.Backlog}>Backlog</option>
          </Select>
        </div>
        <Input
          label="Tags"
          placeholder="Comma-separated tags"
          error={errors.tags?.message}
          {...register("tags")}
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-2">
          <Input
            type="date"
            label="Start Date"
            error={errors.startDate?.message}
            {...register("startDate")}
          />
          <Input
            type="date"
            label="Due Date"
            error={errors.dueDate?.message}
            {...register("dueDate")}
          />
        </div>
        <Input
          type="number"
          label="Author User ID"
          placeholder="Author User ID"
          error={errors.authorUserId?.message}
          {...register("authorUserId", { valueAsNumber: true })}
        />
        <Input
          type="number"
          label="Assigned User ID"
          placeholder="Assigned User ID"
          error={errors.assignedUserId?.message}
          {...register("assignedUserId", { valueAsNumber: true })}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (isEditMode ? "Saving..." : "Creating...") : isEditMode ? "Save Task" : "Create Task"}
        </Button>
      </form>
    </Modal>
  );
};

export default TaskForm;
