import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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

  async create(createTaskDto: CreateTaskDto, actorId?: number) {
    return this.prisma.$transaction(async (prisma) => {
      const task = await prisma.task.create({
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

      if (actorId) {
        await prisma.activityLog.create({
          data: {
            eventType: "TASK_CREATED",
            message: `Task "${task.title}" created`,
            actorId,
            projectId: task.projectId,
            taskId: task.id,
          },
        });
      }

      return task;
    });
  }

  async findAll(projectId: number, filterDto?: FilterSortDto, userId?: number) {
    const where: any = { projectId };

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

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

  async findOne(id: number, userId?: number) {
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

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return task;
  }

  async updateStatus(id: number, updateTaskStatusDto: UpdateTaskStatusDto, actorId?: number) {
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

    return this.prisma.$transaction(async (prisma) => {
      const updatedTask = await prisma.task.update({
        where: { id },
        data: { status: updateTaskStatusDto.status },
        include: {
          author: true,
          assignee: true,
        },
      });

      await prisma.taskHistory.create({
        data: {
          taskId: id,
          field: "status",
          oldValue: task.status,
          newValue: updateTaskStatusDto.status,
          changedById: actorId,
        },
      });

      if (actorId) {
        await prisma.activityLog.create({
          data: {
            eventType: "TASK_STATUS_CHANGED",
            message: `Task status changed from "${task.status}" to "${updateTaskStatusDto.status}"`,
            actorId,
            projectId: task.projectId,
            taskId: id,
          },
        });
      }

      return updatedTask;
    });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, actorId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    // Check if user has access to the project
    if (actorId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId: actorId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async remove(id: number, userId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return this.prisma.task.delete({
      where: { id },
    });
  }

  async addDependency(taskId: number, blockedById: number, userId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
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

  async removeDependency(taskId: number, blockedById: number, userId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

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

  async getDependencies(taskId: number, userId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return this.prisma.taskDependency.findMany({
      where: { taskId },
      include: { blockedBy: true },
    });
  }

  async getChildren(parentId: number, userId?: number) {
    const parent = await this.prisma.task.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      throw new NotFoundException(`Task with id ${parentId} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: parent.projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
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

  async addWatcher(taskId: number, userId: number, actorId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    // Check if actor has access to the project
    if (actorId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId: actorId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
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

  async removeWatcher(taskId: number, userId: number, actorId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    // Check if actor has access to the project
    if (actorId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId: actorId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

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

  async getWatchers(taskId: number, userId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const membership = await this.prisma.projectMembership.findFirst({
        where: {
          projectId: task.projectId,
          userId,
          status: "ACTIVE",
        },
      });
      if (!membership) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return this.prisma.taskWatcher.findMany({
      where: { taskId },
      include: { user: true },
    });
  }
}
