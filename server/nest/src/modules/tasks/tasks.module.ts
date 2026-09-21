import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { TaskWorkflowService } from "./services/task-workflow.service";
import { WorkflowService } from "./workflow/workflow.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [TasksController],
  providers: [TasksService, TaskWorkflowService, WorkflowService, PrismaService],
  exports: [TasksService, TaskWorkflowService, WorkflowService],
})
export class TasksModule {}
