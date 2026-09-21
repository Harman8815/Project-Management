import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ExportQueryDto, ExportFormat, ExportType } from "./dto/export-query.dto";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";
import { convertToCSV } from "../../common/utils/csv.util";

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMembershipsService: ProjectMembershipsService,
  ) {}

  private async checkProjectAccess(userId: number, projectId: number) {
    const hasAccess = await this.projectMembershipsService.checkUserAccess(
      userId,
      projectId,
    );
    if (!hasAccess) {
      throw new ForbiddenException("You do not have access to this project");
    }
  }

  private async getTasksData(projectId?: number, sprintId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (sprintId) where.sprintId = sprintId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        author: true,
        assignee: true,
        project: true,
        sprint: true,
        milestone: true,
      },
    });

    return tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      points: task.points,
      estimateHours: task.estimateHours,
      actualHours: task.actualHours,
      dueDate: task.dueDate,
      projectId: task.projectId,
      projectName: task.project?.name,
      sprintId: task.sprintId,
      sprintName: task.sprint?.name,
      milestoneId: task.milestoneId,
      milestoneName: task.milestone?.name,
      authorUsername: task.author?.username,
      assigneeUsername: task.assignee?.username,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));
  }

  private async getProjectsData(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        members: true,
        _count: {
          select: {
            tasks: true,
            milestones: true,
            sprints: true,
          },
        },
      },
    });

    return projects.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      health: project.health,
      startDate: project.startDate,
      endDate: project.endDate,
      dueDate: project.dueDate,
      archived: project.archived,
      memberCount: project.members.length,
      taskCount: project._count.tasks,
      milestoneCount: project._count.milestones,
      sprintCount: project._count.sprints,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }

  private async getMilestonesData(projectId?: number) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const milestones = await this.prisma.milestone.findMany({
      where,
      include: {
        project: true,
        owner: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return milestones.map((milestone: any) => ({
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      status: milestone.status,
      projectId: milestone.projectId,
      projectName: milestone.project?.name,
      startDate: milestone.startDate,
      dueDate: milestone.dueDate,
      ownerUsername: milestone.owner?.username,
      taskCount: milestone._count.tasks,
      createdAt: milestone.createdAt,
      updatedAt: milestone.updatedAt,
    }));
  }

  private async getSprintsData(projectId?: number) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const sprints = await this.prisma.sprint.findMany({
      where,
      include: {
        project: true,
        owner: true,
        _count: {
          select: {
            sprintTasks: true,
          },
        },
      },
    });

    return sprints.map((sprint: any) => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      projectId: sprint.projectId,
      projectName: sprint.project?.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      capacity: sprint.capacity,
      ownerUsername: sprint.owner?.username,
      taskCount: sprint._count.sprintTasks,
      createdAt: sprint.createdAt,
      updatedAt: sprint.updatedAt,
    }));
  }

  private async getActivityData(projectId?: number, startDate?: string, endDate?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const activities = await this.prisma.activityLog.findMany({
      where,
      include: {
        actor: true,
        project: true,
        task: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return activities.map((activity: any) => ({
      id: activity.id,
      eventType: activity.eventType,
      actorUsername: activity.actor?.username,
      projectId: activity.projectId,
      projectName: activity.project?.name,
      taskId: activity.taskId,
      taskTitle: activity.task?.title,
      targetUserId: activity.targetUserId,
      message: activity.message,
      createdAt: activity.createdAt,
    }));
  }

  async exportData(query: ExportQueryDto, userId?: number) {
    const { type, format = ExportFormat.CSV, projectId, sprintId, startDate, endDate } = query;

    if (projectId && userId) {
      await this.checkProjectAccess(userId, projectId);
    }

    let data: Record<string, any>[];

    switch (type) {
      case ExportType.TASKS:
        data = await this.getTasksData(projectId, sprintId, startDate, endDate);
        break;
      case ExportType.PROJECTS:
        data = await this.getProjectsData(startDate, endDate);
        break;
      case ExportType.MILESTONES:
        data = await this.getMilestonesData(projectId);
        break;
      case ExportType.SPRINTS:
        data = await this.getSprintsData(projectId);
        break;
      case ExportType.ACTIVITY:
        data = await this.getActivityData(projectId, startDate, endDate);
        break;
      default:
        data = await this.getTasksData(projectId, sprintId, startDate, endDate);
    }

    if (format === ExportFormat.CSV) {
      return {
        format: "CSV",
        type,
        data: convertToCSV(data),
        recordCount: data.length,
      };
    }

    if (format === ExportFormat.EXCEL) {
      return {
        format: "EXCEL",
        type,
        data: JSON.stringify(data),
        recordCount: data.length,
      };
    }

    if (format === ExportFormat.PDF) {
      return {
        format: "PDF",
        type,
        data: JSON.stringify(data),
        recordCount: data.length,
      };
    }

    return {
      format,
      type,
      data,
      recordCount: data.length,
    };
  }
}