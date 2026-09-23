import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateActivityLogDto, ActivityEventType } from "./dto/create-activity-log.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createActivityLogDto: CreateActivityLogDto, actorId?: number) {
    // Check if user has access to the project
    if (createActivityLogDto.projectId && actorId) {
      const hasAccess = await this.checkUserAccess(actorId, createActivityLogDto.projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to create audit records");
      }
    }

    return this.prisma.activityLog.create({
      data: {
        eventType: createActivityLogDto.eventType,
        message: createActivityLogDto.message,
        actorId: createActivityLogDto.actorId || actorId,
        projectId: createActivityLogDto.projectId,
        taskId: createActivityLogDto.taskId,
        targetUserId: createActivityLogDto.targetUserId,
        metadata: createActivityLogDto.metadata
          ? JSON.stringify(createActivityLogDto.metadata)
          : undefined,
      },
      include: {
        actor: {
          select: { userId: true, username: true, profilePictureUrl: true },
        },
        targetUser: {
          select: { userId: true, username: true },
        },
      },
    });
  }

  async logEvent(
    eventType: ActivityEventType,
    message: string,
    context: {
      actorId?: number;
      projectId?: number;
      taskId?: number;
      targetUserId?: number;
      metadata?: Record<string, any>;
    },
  ) {
    return this.create({
      eventType,
      message,
      ...context,
    });
  }

  async findAll(query: PaginationDto & {
    projectId?: number;
    taskId?: number;
    eventType?: string;
    actorId?: number;
    targetUserId?: number;
  }, userId?: number) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.projectId) {
      where.projectId = Number(query.projectId);
      
      // Check if user has access to the project
      if (userId) {
        const hasAccess = await this.checkUserAccess(userId, Number(query.projectId));
        if (!hasAccess) {
          throw new ForbiddenException("You do not have permission to view audit records");
        }
      }
    }
    if (query.taskId) {
      where.taskId = Number(query.taskId);
    }
    if (query.eventType) {
      where.eventType = query.eventType;
    }
    if (query.actorId) {
      where.actorId = Number(query.actorId);
    }
    if (query.targetUserId) {
      where.targetUserId = Number(query.targetUserId);
    }

    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          actor: {
            select: { userId: true, username: true, profilePictureUrl: true },
          },
          targetUser: {
            select: { userId: true, username: true },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number, userId?: number) {
    const log = await this.prisma.activityLog.findUnique({
      where: { id },
      include: {
        actor: {
          select: { userId: true, username: true, profilePictureUrl: true },
        },
        targetUser: {
          select: { userId: true, username: true },
        },
        project: true,
      },
    });
    if (!log) {
      throw new NotFoundException(`ActivityLog with id ${id} not found`);
    }

    // Check if user has access to view the audit record
    if (userId && log.projectId) {
      const hasAccess = await this.checkUserAccess(userId, log.projectId);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to view this audit record");
      }
    }

    return log;
  }

  async delete(id: number, actorId: number) {
    const log = await this.prisma.activityLog.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!log) {
      throw new NotFoundException(`ActivityLog with id ${id} not found`);
    }

    // Only allow deletion by admin or owner
    if (log.projectId) {
      const hasAccess = await this.checkUserAccess(actorId, log.projectId, ["ADMIN", "OWNER"]);
      if (!hasAccess) {
        throw new ForbiddenException("You do not have permission to delete audit records");
      }
    }

    return this.prisma.activityLog.delete({
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
}
