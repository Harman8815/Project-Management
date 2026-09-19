import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const GetTasksQuerySchema = z.object({
  projectId: z.coerce.number().int().positive(),
});

export const UpdateTaskStatusSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  status: z.enum(["To Do", "Work In Progress", "Under Review", "Completed"]),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  status: z.enum(["To Do", "Work In Progress", "Under Review", "Completed"]),
  priority: z.enum(["Urgent", "High", "Medium", "Low", "Backlog"]),
  tags: z.string().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  points: z.number().int().nonnegative().optional(),
  projectId: z.number().int().positive(),
  authorUserId: z.number().int().positive(),
  assignedUserId: z.number().int().positive().optional(),
});

export const GetUserByCognitoIdSchema = z.object({
  cognitoId: z.string().min(1),
});

export const SearchQuerySchema = z.object({
  query: z.string().min(3, "Search query must be at least 3 characters"),
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;
export type GetTasksQueryDto = z.infer<typeof GetTasksQuerySchema>;
export type UpdateTaskStatusDto = z.infer<typeof UpdateTaskStatusSchema>;
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;
export type GetUserByCognitoIdDto = z.infer<typeof GetUserByCognitoIdSchema>;
export type SearchQueryDto = z.infer<typeof SearchQuerySchema>;
