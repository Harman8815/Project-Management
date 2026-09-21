import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { FilterSortDto } from "../../common/dto/filter-sort.dto";
import { WorkflowService } from "./workflow/workflow.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowService: WorkflowService,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        identifier: createTaskDto.identifier,
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status,
        priority: createTaskDto.priority,
        severity: createTaskDto.severity,
        type: createTaskDto.type || "TASK",
        tags: createTaskDto.tags,
        startDate: createTaskDto.startDate,
        dueDate: createTaskDto.dueDate,
        points: createTaskDto.points,
        estimateHours: createTaskDto.estimateHours,
        actualHours: createTaskDto.actualHours,
        acceptanceCriteria: createTaskDto.acceptanceCriteria,
        parentId: createTaskDto.parentId,
        projectId: createTaskDto.projectId,
        authorUserId: createTaskDto.authorUserId,
        assignedUserId: createTaskDto.assignedUserId,
      },
      include: {
        author: true,
        assignee: true,
        children: true,
        watchers: { include: { user: true } },
      },
    });
  }

  async findAll(projectId: number, filterDto?: FilterSortDto) {
    const where: any = { projectId };

    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    if (filterDto?.priority) {
      where.priority = filterDto.priority;
    }

    if (filterDto?.search) {
      where.OR = [
        { title: { contains: filterDto.search } },
        { description: { contains: filterDto.search } },
      ];
    }

    const orderBy: any = {};
    if (filterDto?.sortBy) {
      orderBy[filterDto.sortBy] = filterDto.sortOrder || "asc";
    }

    return this.prisma.task.findMany({
      where,
      orderBy,
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.task.findMany({
      where: {
        OR: [
          { authorUserId: userId },
          { assignedUserId: userId },
        ],
      },
      include: {
        author: true,
        assignee: true,
      },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async updateStatus(id: number, updateTaskStatusDto: UpdateTaskStatusDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    this.workflowService.validateTransition(
      task.status,
      updateTaskStatusDto.status,
      task.projectId,
    );

    return this.prisma.task.update({
      where: { id },
      data: { status: updateTaskStatusDto.status },
      include: {
        author: true,
        assignee: true,
      },
    });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async remove(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return this.prisma.task.delete({
      where: { id },
    });
  }

  async addDependency(taskId: number, blockedById: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const blockedBy = await this.prisma.task.findUnique({
      where: { id: blockedById },
    });
    if (!blockedBy) {
      throw new NotFoundException(`Task with id ${blockedById} not found`);
    }

    if (taskId === blockedById) {
      throw new BadRequestException("A task cannot depend on itself");
    }

    const isCircular = await this.checkCircularDependency(taskId, blockedById);
    if (isCircular) {
      throw new BadRequestException(
        "This dependency would create a circular reference",
      );
    }

    return this.prisma.taskDependency.create({
      data: {
        taskId,
        blockedById,
      },
    });
  }

  async removeDependency(taskId: number, blockedById: number) {
    const dependency = await this.prisma.taskDependency.findFirst({
      where: { taskId, blockedById },
    });
    if (!dependency) {
      throw new NotFoundException(
        `Dependency from task ${taskId} blocked by ${blockedById} not found`,
      );
    }
    return this.prisma.taskDependency.delete({
      where: { id: dependency.id },
    });
  }

  async getDependencies(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    return this.prisma.taskDependency.findMany({
      where: { taskId },
      include: { blockedBy: true },
    });
  }

  async addWatcher(taskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.prisma.taskWatcher.create({
      data: { taskId, userId },
    });
  }

  async removeWatcher(taskId: number, userId: number) {
    const watcher = await this.prisma.taskWatcher.findFirst({
      where: { taskId, userId },
    });
    if (!watcher) {
      throw new NotFoundException(
        `Watcher for user ${userId} on task ${taskId} not found`,
      );
    }
    return this.prisma.taskWatcher.delete({
      where: { id: watcher.id },
    });
  }

  async getWatchers(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    return this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: { user: true },
    });
  }

  async getChildren(parentId: number) {
    const parent = await this.prisma.task.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException(`Task with id ${parentId} not found`);
    }

    return this.prisma.task.findMany({
      where: { parentId },
      include: {
        author: true,
        assignee: true,
      },
    });
  }

  getValidTransitions(status: string, projectId?: string) {
    return this.workflowService.getValidTransitions(
      status,
      projectId ? Number(projectId) : undefined,
    );
  }

  getDefaultWorkflow() {
    return this.workflowService.getProjectWorkflow();
  }

  getWorkflowForProject(projectId: number) {
    return this.workflowService.getProjectWorkflow(projectId);
  }

  private async checkCircularDependency(
    taskId: number,
    blockedById: number,
  ): Promise<boolean> {
    const visited = new Set<number>();
    const queue: number[] = [taskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === blockedById) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const deps = await this.prisma.taskDependency.findMany({
        where: { taskId: current },
      });
      for (const dep of deps) {
        if (!visited.has(dep.blockedById)) {
          queue.push(dep.blockedById);
        }
      }
    }
    return false;
  }
}
