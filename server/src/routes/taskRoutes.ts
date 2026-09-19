import { Router } from "express";
import {
  createTask,
  getTasks,
  getUserTasks,
  updateTaskStatus,
} from "../controllers/taskController";
import { validate } from "../middleware/validation";
import {
  CreateTaskSchema,
  GetTasksQuerySchema,
  UpdateTaskStatusSchema,
} from "../dtos";

const router = Router();

router.get("/", validate({ query: GetTasksQuerySchema }), getTasks);
router.post("/", validate({ body: CreateTaskSchema }), createTask);
router.patch(
  "/:taskId/status",
  validate({
    params: UpdateTaskStatusSchema.pick({ taskId: true }),
    body: UpdateTaskStatusSchema.pick({ status: true }),
  }),
  updateTaskStatus,
);
router.get("/user/:userId", getUserTasks);

export default router;
