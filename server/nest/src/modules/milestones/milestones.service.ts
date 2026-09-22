import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMilestoneDto, UpdateMilestoneDto } from "./dto/create-milestone.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMilestoneDto: CreateMilestoneDto, actorId?: number) {
    await this.ensureProjectExists(createMilestoneDto.projectId);
    
    // Check if user has access to the project
    if (actorId) {
      const hasAccess = await this.checkUserAccess(actorId, createMilestoneDto.projectId, ["ADMIN", "OWNER", "MANAGER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to create milestones");
      }
    }

    return this.prisma.milestone.create({
      data: {
        name: createMilestoneDto.name,
        description: createMilestoneDto.description,
        projectId: createMilestoneDto.projectId,
        startDate: createMilestoneDto.startDate,
        dueDate: createMilestoneDto.dueDate,
        status: createMilestoneDto.status || "PLANNED",
        ownerId: createMilestoneDto.ownerId,
      },
      include: {
        project: true,
        owner: true,
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
      this.prisma.milestone.findMany({
        where,
        skip,
        take,
        include: {
          project: true,
          owner: true,
        },
      }),
      this.prisma.milestone.count({ where }),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number, userId?: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        project: true,
        owner: true,
      },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await this.checkUserAccess(userId, milestone.projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return milestone;
  }

  async getCompletion(id: number, userId?: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await this.checkUserAccess(userId, milestone.projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    const totalTasks = milestone.tasks.length;
    const completedTasks = milestone.tasks.filter(
      (t) => t.status === "Completed" || t.status === "Done",
    ).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      milestoneId: id,
      milestoneName: milestone.name,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
    };
  }

  async update(id: number, updateMilestoneDto: UpdateMilestoneDto, actorId?: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }

    // Check if user has access to the project
    if (actorId) {
      const hasAccess = await this.checkUserAccess(actorId, milestone.projectId, ["ADMIN", "OWNER", "MANAGER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to update milestones");
      }
    }

    return this.prisma.milestone.update({
      where: { id },
      data: {
        name: updateMilestoneDto.name,
        description: updateMilestoneDto.description,
        startDate: updateMilestoneDto.startDate,
        dueDate: updateMilestoneDto.dueDate,
        status: updateMilestoneDto.status,
        ownerId: updateMilestoneDto.ownerId,
      },
      include: {
        project: true,
        owner: true,
      },
    });
  }

  async remove(id: number, actorId?: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }

    // Check if user has access to the project
    if (actorId) {
      const hasAccess = await this.checkUserAccess(actorId, milestone.projectId, ["ADMIN", "OWNER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to delete milestones");
      }
    }

    return this.prisma.milestone.delete({
      where: { id },
    });
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

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
  }
}
