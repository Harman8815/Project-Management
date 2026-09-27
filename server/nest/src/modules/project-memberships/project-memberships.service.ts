import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectMembershipDto } from "./dto/create-project-membership.dto";
import { UpdateProjectMembershipDto } from "./dto/update-project-membership.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

export interface TransferResult {
  success: boolean;
  message: string;
  previousProjectId?: number;
  newProjectId?: number;
}

@Injectable()
export class ProjectMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createProjectMembershipDto: CreateProjectMembershipDto,
    requestingUserId?: number,
  ) {
    await this.ensureProjectExists(createProjectMembershipDto.projectId);
    await this.ensureUserExists(createProjectMembershipDto.userId);

    if (requestingUserId) {
      const canManage = await this.checkUserAccess(
        requestingUserId,
        createProjectMembershipDto.projectId,
        ["OWNER", "MANAGER"],
      );
      if (!canManage) {
        throw new ForbiddenException(
          "You do not have permission to manage project memberships",
        );
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.projectMembership.findFirst({
        where: {
          projectId: createProjectMembershipDto.projectId,
          userId: createProjectMembershipDto.userId,
        },
      });
      if (existing) {
        throw new BadRequestException(
          "User is already a member of this project",
        );
      }

      return prisma.projectMembership.create({
        data: {
          projectId: createProjectMembershipDto.projectId,
          userId: createProjectMembershipDto.userId,
          role: createProjectMembershipDto.role || "MEMBER",
          status: createProjectMembershipDto.status || "ACTIVE",
          invitedById: createProjectMembershipDto.invitedById,
        },
        include: {
          user: true,
          project: true,
          invitedBy: true,
        },
      });
    });
  }

  async invite(
    projectId: number,
    cognitoId: string,
    role: string = "MEMBER",
    invitedById?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoId },
    });
    if (!user) {
      throw new NotFoundException(`User with cognitoId ${cognitoId} not found`);
    }

    await this.ensureProjectExists(projectId);

    if (invitedById) {
      const canManage = await this.checkUserAccess(
        invitedById,
        projectId,
        ["OWNER", "MANAGER"],
      );
      if (!canManage) {
        throw new ForbiddenException(
          "You do not have permission to invite members",
        );
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const existing = await prisma.projectMembership.findFirst({
        where: { projectId, userId: user.userId },
      });
      if (existing) {
        throw new BadRequestException(
          `User ${user.username} is already a member of this project`,
        );
      }

      const membership = await prisma.projectMembership.create({
        data: {
          projectId,
          userId: user.userId,
          role,
          status: "INVITED",
          invitedById,
        },
        include: {
          user: true,
          project: true,
          invitedBy: true,
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.userId,
          type: "INVITATION",
          title: `You've been invited to a project`,
          message: `You've been invited to join the project as a ${role}`,
        },
      });

      return membership;
    });
  }

  async findAll(query: PaginationDto & { projectId?: number; search?: string }, userId?: number) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.search) {
      where.user = { username: { contains: query.search } };
    }
    if (query.projectId) {
      where.projectId = Number(query.projectId);
    }

    // If userId is provided, only return memberships for projects the user has access to
    if (userId) {
      const userProjectIds = await this.prisma.projectMembership.findMany({
        where: { userId, status: "ACTIVE" },
        select: { projectId: true },
      });
      where.projectId = { in: userProjectIds.map(m => m.projectId) };
    }

    const [data, total] = await Promise.all([
      this.prisma.projectMembership.findMany({
        skip,
        take,
        where,
        include: {
          user: true,
          project: true,
          invitedBy: true,
        },
      }),
      this.prisma.projectMembership.count({ where }),
    ]);
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 10 },
    };
  }

  async findOne(id: number, userId?: number) {
    const membership = await this.prisma.projectMembership.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        invitedBy: true,
      },
    });
    if (!membership) {
      throw new NotFoundException(
        `ProjectMembership with id ${id} not found`,
      );
    }

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await this.checkUserAccess(userId, membership.projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    return membership;
  }

  async findByProject(projectId: number, query: PaginationDto, userId?: number) {
    const { skip, take } = getPaginationParams(query);

    await this.ensureProjectExists(projectId);

    // Check if user has access to the project
    if (userId) {
      const hasAccess = await this.checkUserAccess(userId, projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have access to this project");
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.projectMembership.findMany({
        where: { projectId },
        skip,
        take,
        include: {
          user: true,
          invitedBy: true,
        },
      }),
      this.prisma.projectMembership.count({ where: { projectId } }),
    ]);
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 10 },
    };
  }

  async findByUser(userId: number, query: PaginationDto) {
    const { skip, take } = getPaginationParams(query);

    await this.ensureUserExists(userId);

    const [data, total] = await Promise.all([
      this.prisma.projectMembership.findMany({
        where: { userId },
        skip,
        take,
        include: {
          project: true,
          invitedBy: true,
        },
      }),
      this.prisma.projectMembership.count({ where: { userId } }),
    ]);
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 10 },
    };
  }

  async update(
    id: number,
    updateProjectMembershipDto: UpdateProjectMembershipDto,
    requestingUserId?: number,
  ) {
    const membership = await this.prisma.projectMembership.findUnique({
      where: { id },
    });
    if (!membership) {
      throw new NotFoundException(
        `ProjectMembership with id ${id} not found`,
      );
    }

    if (requestingUserId) {
      const canManage = await this.checkUserAccess(
        requestingUserId,
        membership.projectId,
        ["OWNER", "MANAGER"],
      );
      if (!canManage) {
        throw new ForbiddenException(
          "You do not have permission to update memberships",
        );
      }
    }

    return this.prisma.projectMembership.update({
      where: { id },
      data: updateProjectMembershipDto,
      include: {
        user: true,
        project: true,
        invitedBy: true,
      },
    });
  }

  async remove(id: number, requestingUserId?: number) {
    const membership = await this.prisma.projectMembership.findUnique({
      where: { id },
    });
    if (!membership) {
      throw new NotFoundException(
        `ProjectMembership with id ${id} not found`,
      );
    }

    if (requestingUserId && requestingUserId !== membership.userId) {
      const canManage = await this.checkUserAccess(
        requestingUserId,
        membership.projectId,
        ["OWNER", "MANAGER"],
      );
      if (!canManage) {
        throw new ForbiddenException(
          "You do not have permission to remove members",
        );
      }
    }

    return this.prisma.projectMembership.delete({
      where: { id },
    });
  }

  async transferEmployee(
    userId: number,
    targetProjectId: number,
    actorId: number,
    role: string = "MEMBER",
  ): Promise<TransferResult> {
    // Validate actor has ADMIN/OWNER on BOTH source and target projects
    const sourceMemberships = await this.prisma.projectMembership.findMany({
      where: { userId, status: "ACTIVE" },
      include: { project: true },
    });

    const sourceProjectIds = sourceMemberships.map(m => m.projectId);

    if (sourceProjectIds.length === 0) {
      throw new BadRequestException("Employee is not assigned to any project");
    }

    // Check if already in target project
    if (sourceProjectIds.includes(targetProjectId)) {
      throw new BadRequestException("Employee is already a member of the target project");
    }

    // Validate actor has ADMIN/OWNER on target project
    const targetAccess = await this.checkUserAccess(actorId, targetProjectId, ["OWNER", "ADMIN"]);
    if (!targetAccess) {
      throw new ForbiddenException("You do not have permission to manage the target project");
    }

    // Check target project capacity
    const targetProject = await this.prisma.project.findUnique({
      where: { id: targetProjectId },
    });
    if (!targetProject) {
      throw new NotFoundException("Target project not found");
    }

    const targetMemberCount = await this.prisma.projectMembership.count({
      where: { projectId: targetProjectId, status: "ACTIVE" },
    });

    // Default capacity of 10
    const capacity = 10;
    if (targetMemberCount >= capacity) {
      throw new BadRequestException("Target project has reached maximum capacity");
    }

    // Validate actor has ADMIN/OWNER on at least one source project
    let hasSourceAccess = false;
    for (const pid of sourceProjectIds) {
      const access = await this.checkUserAccess(actorId, pid, ["OWNER", "ADMIN"]);
      if (access) {
        hasSourceAccess = true;
        break;
      }
    }
    if (!hasSourceAccess) {
      throw new ForbiddenException("You do not have permission to manage the employee's current project(s)");
    }

    // Perform the transfer in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const sourceProjectId = sourceProjectIds[0]; // Transfer from first active project
      
      // Deactivate old membership
      await prisma.projectMembership.updateMany({
        where: { userId, projectId: sourceProjectId, status: "ACTIVE" },
        data: { status: "INACTIVE" },
      });

      // Create new membership
      await prisma.projectMembership.create({
        data: {
          userId,
          projectId: targetProjectId,
          role,
          status: "ACTIVE",
        },
      });

      // Update user's currentProjectId
      await prisma.user.update({
        where: { userId },
        data: { currentProjectId: targetProjectId },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          eventType: "RESOURCE_TRANSFER",
          actorId,
          projectId: targetProjectId,
          targetUserId: userId,
          message: `Employee transferred from project ${sourceProjectId} to project ${targetProjectId}`,
          metadata: JSON.stringify({ 
            sourceProjectId, 
            targetProjectId, 
            role,
            transferredBy: actorId 
          }),
        },
      });

      // Create notification for the employee
      await prisma.user.findUnique({ where: { userId } });
      await prisma.notification.create({
        data: {
          userId,
          type: "TRANSFER",
          title: "Project Transfer",
          message: `You have been transferred to ${targetProject.name}`,
          link: `/projects/${targetProjectId}`,
        },
      });

      return {
        success: true,
        message: "Employee transferred successfully",
        previousProjectId: sourceProjectId,
        newProjectId: targetProjectId,
      };
    });
  }

  async getTransferHistory(userId: number) {
    const logs = await this.prisma.activityLog.findMany({
      where: {
        eventType: "RESOURCE_TRANSFER",
        targetUserId: userId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { username: true } },
        project: { select: { name: true, key: true } },
      },
    });

    return logs.map(log => {
      const meta = JSON.parse(log.metadata || "{}");
      return {
        id: log.id,
        employeeId: userId,
        fromProjectId: meta.sourceProjectId,
        toProjectId: meta.targetProjectId,
        actorName: log.actor?.username,
        projectName: log.project?.name,
        projectKey: log.project?.key,
        date: log.createdAt,
        role: meta.role,
      };
    });
  }

  async checkUserAccess(
    userId: number,
    projectId: number,
    requiredRoles: string[] = [],
  ): Promise<boolean> {
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

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  }
}