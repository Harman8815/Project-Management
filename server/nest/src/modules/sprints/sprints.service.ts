import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSprintDto, UpdateSprintDto } from "./dto/create-sprint.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class SprintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSprintDto: CreateSprintDto, actorId?: number) {
    await this.ensureProjectExists(createSprintDto.projectId);
    
    // Check if user has access to the project
    if (actorId) {
      const hasAccess = await this.checkUserAccess(actorId, createSprintDto.projectId, ["ADMIN", "OWNER", "MANAGER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to create sprints");
      }
    }

    return this.prisma.sprint.create({
      data: {
        name: createSprintDto.name,
        projectId: createSprintDto.projectId,
        goal: createSprintDto.goal,
        startDate: createSprintDto.startDate,
        endDate: createSprintDto.endDate,
        status: createSprintDto.status || "PLANNED",
        capacity: createSprintDto.capacity,
        ownerId: createSprintDto.ownerId,
      },
      include: {
        project: true,
        owner: true,
        sprintTasks: true,
      },
    });
  }

  async findAll(query: PaginationDto & { projectId?: number }, userId?: number) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.projectId) {
      where.projectId = Number(query.projectId);
      
      // Check if user has access to the project
      if (userId) {
        const hasAccess = await this.checkUserAccess(userId, Number(query.projectId));
        if (!hasAccess) {
          throw new ForbiddenException("You do not have access to this project");
        }
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.sprint.findMany({
        where,
        skip,
        take,
        include: {
          project: true,
          owner: true,
        },
      }),
      this.prisma.sprint.count({ where }),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number, userId?: number) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
      include: {
        project: true,
        owner: true,
        sprintTasks: true,
      },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint with id ${id} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await this.checkUserAccess(userId, sprint.projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return sprint;
  }

  async getBurndown(sprintId: number, userId?: number) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        sprintTasks: {
          select: { points: true, estimateHours: true, status: true },
        },
      },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint with id ${sprintId} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await this.checkUserAccess(userId, sprint.projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    const totalPoints = sprint.sprintTasks.reduce(
      (sum, t) => sum + (t.points || 0),
      0,
    );
    const completedPoints = sprint.sprintTasks
      .filter((t) => t.status === "Completed" || t.status === "Done")
      .reduce((sum, t) => sum + (t.points || 0), 0);

    return {
      sprintId,
      sprintName: sprint.name,
      totalTasks: sprint.sprintTasks.length,
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      completionRate:
        totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
    };
  }

  async update(id: number, updateSprintDto: UpdateSprintDto, actorId?: number) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint with id ${id} not found`);
    }

    // Check if user has access to the project
    if (actorId) {
      const hasAccess = await this.checkUserAccess(actorId, sprint.projectId, ["ADMIN", "OWNER", "MANAGER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to update sprints");
      }
    }

    // Validate status transition
    if (updateSprintDto.status && updateSprintDto.status !== sprint.status) {
      const isValidTransition = this.validateSprintStatusTransition(sprint.status, updateSprintDto.status);
      if (!isValidTransition) {
        throw new BadRequestException(
          `Invalid sprint status transition: ${sprint.status} -> ${updateSprintDto.status}`
        );
      }
    }

    return this.prisma.sprint.update({
      where: { id },
      data: {
        name: updateSprintDto.name,
        goal: updateSprintDto.goal,
        startDate: updateSprintDto.startDate,
        endDate: updateSprintDto.endDate,
        status: updateSprintDto.status,
        capacity: updateSprintDto.capacity,
        ownerId: updateSprintDto.ownerId,
      },
      include: {
        project: true,
        owner: true,
        sprintTasks: true,
      },
    });
  }

  async getBacklog(projectId: number, userId?: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await this.checkUserAccess(userId, projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return this.prisma.task.findMany({
      where: {
        projectId,
        sprintId: null,
      },
      include: {
        author: true,
        assignee: true,
      },
    });
  }

  async assignToSprint(taskId: number, sprintId: number, actorId?: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint with id ${sprintId} not found`);
    }

    // Check if user has access to the project
    if (actorId) {
      const hasAccess = await this.checkUserAccess(actorId, task.projectId, ["ADMIN", "OWNER", "MANAGER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to assign tasks to sprints");
      }
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: { sprintId },
      include: {
        author: true,
        assignee: true,
        sprint: true,
      },
    });
  }

  async remove(id: number, actorId?: number) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id },
    });
    if (!sprint) {
      throw new NotFoundException(`Sprint with id ${id} not found`);
    }

    // Check if user has access to the project
    if (actorId) {
      const hasAccess = await this.checkUserAccess(actorId, sprint.projectId, ["ADMIN", "OWNER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to delete sprints");
      }
    }

    return this.prisma.sprint.delete({
      where: { id },
    });
  }

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
  }

  private validateSprintStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      PLANNED: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["COMPLETED", "CANCELLED"],
      COMPLETED: [], // Cannot transition from completed
      CANCELLED: ["PLANNED"], // Can reactivate cancelled sprints
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  private async checkUserAccess(userId: number, projectId: number, requiredRoles: string[] = []): Promise<boolean> {
    const membership = await this.prisma.projectMembership.findFirst({
      where: { userId, projectId, status: "ACTIVE" },
    });
    if (!membership) {
      return false;
    }
    if (requiredRoles.length > 0) {
      return requiredRoles.includes(membership.role);
    }
    return true;
  }
}
