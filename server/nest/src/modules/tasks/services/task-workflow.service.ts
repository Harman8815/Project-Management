import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { WorkflowService, WorkflowDefinition } from "../workflow/workflow.service";
import { UpdateTaskStatusDto } from "../dto/update-task-status.dto";

@Injectable()
export class TaskWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowService,
  ) {}

  async validateStatusTransition(
    taskId: number,
    updateDto: UpdateTaskStatusDto,
  ) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true, projectId: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    return this.workflowService.validateTransition(
      task.status,
      updateDto.status,
      task.projectId,
    );
  }

  async getWorkflowForProject(projectId: number): Promise<WorkflowDefinition> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    return this.workflowService.getProjectWorkflow(projectId);
  }

  async setWorkflowForProject(
    projectId: number,
    workflow: WorkflowDefinition,
  ): Promise<WorkflowDefinition> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    this.workflowService.setProjectWorkflow(projectId, workflow);
    return workflow;
  }

  getValidTransitions(currentStatus: string, projectId?: number) {
    const workflow = this.workflowService.getProjectWorkflow(projectId);
    const transition = workflow.transitions.find(
      (t) => t.from === currentStatus,
    );
    return transition ? transition.to : [];
  }
}
