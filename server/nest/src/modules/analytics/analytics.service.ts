import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";

@Injectable()
export class AnalyticsService {
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

  async getProjectMetrics(projectId: number, query?: AnalyticsQueryDto) {
    await this.checkProjectAccess(query?.userId || 0, projectId);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      openTasks,
    ] = await Promise.all([
      this.prisma.task.count({ where: { projectId } }),
      this.prisma.task.count({
        where: { projectId, status: { in: ["Completed", "Done"] } },
      }),
      this.prisma.task.count({
        where: { projectId, status: "In Progress" },
      }),
      this.prisma.task.count({
        where: { projectId, status: "Blocked" },
      }),
      this.prisma.task.count({
        where: {
          projectId,
          dueDate: { lt: new Date() },
          status: { not: { in: ["Completed", "Done"] } },
        },
      }),
      this.prisma.task.count({
        where: {
          projectId,
          status: { in: ["To Do", "In Progress", "In Review"] },
        },
      }),
    ]);

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overdueRate =
      openTasks > 0 ? Math.round((overdueTasks / openTasks) * 100) : 0;
    const health =
      overdueRate > 50
        ? "OFF_TRACK"
        : overdueRate > 25
        ? "AT_RISK"
        : "ON_TRACK";

    return {
      projectId,
      projectName: project.name,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      openTasks,
      completionRate,
      overdueRate,
      health,
    };
  }

  async getUserMetrics(userId: number, query?: AnalyticsQueryDto) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const [
      assignedTasks,
      authoredTasks,
      completedAssigned,
    ] = await Promise.all([
      this.prisma.task.count({ where: { assignedUserId: userId } }),
      this.prisma.task.count({ where: { authorUserId: userId } }),
      this.prisma.task.count({
        where: {
          assignedUserId: userId,
          status: { in: ["Completed", "Done"] },
        },
      }),
    ]);

    return {
      userId,
      username: user.username,
      assignedTasks,
      authoredTasks,
      completedAssigned,
      completionRate:
        assignedTasks > 0
          ? Math.round((completedAssigned / assignedTasks) * 100)
          : 0,
    };
  }

  async getTeamWorkload(query?: AnalyticsQueryDto) {
    const startDate = query?.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query?.endDate ? new Date(query.endDate) : new Date();
    
    const whereClause: any = {
      status: { not: { in: ["Completed", "Done", "Blocked"] } },
    };
    
    if (query?.teamId) {
      whereClause.assignedUser = {
        teamId: query.teamId,
      };
    }
    
    if (query?.projectId) {
      whereClause.projectId = query.projectId;
    }
    
    if (query?.startDate || query?.endDate) {
      whereClause.createdAt = { gte: startDate, lte: endDate };
    }

    const users = await this.prisma.user.findMany({
      where: query?.teamId ? { teamId: query.teamId } : {},
      select: {
        userId: true,
        username: true,
        capacityHoursPerWeek: true,
        capacityStoryPoints: true,
        assignedTasks: {
          where: whereClause,
          select: { points: true, estimateHours: true },
        },
      },
    });

    return users.map((user) => {
      const totalPoints = user.assignedTasks.reduce(
        (sum, t) => sum + (t.points || 0),
        0,
      );
      const totalHours = user.assignedTasks.reduce(
        (sum, t) => sum + (t.estimateHours || 0),
        0,
      );
      
      const capacityHours = user.capacityHoursPerWeek || 40;
      const capacityPoints = user.capacityStoryPoints;
      const hoursUtilization = capacityHours > 0 ? Math.round((totalHours / capacityHours) * 100) : 0;
      const pointsUtilization = capacityPoints && capacityPoints > 0 ? Math.round((totalPoints / capacityPoints) * 100) : 0;
      
      const overAllocated = hoursUtilization > 100 || (capacityPoints && pointsUtilization > 100);

      return {
        userId: user.userId,
        username: user.username,
        activeTaskCount: user.assignedTasks.length,
        totalStoryPoints: totalPoints,
        totalEstimatedHours: totalHours,
        capacityHoursPerWeek: user.capacityHoursPerWeek,
        capacityStoryPoints: user.capacityStoryPoints,
        hoursUtilization,
        pointsUtilization,
        overAllocated,
      };
    });
  }

  async getSprintMetrics(projectId: number, query?: AnalyticsQueryDto) {
    if (query?.projectId) {
      await this.checkProjectAccess(query.userId || 0, projectId);
    }
    const sprints = await this.prisma.sprint.findMany({
      where: projectId ? { projectId } : {},
      include: {
        _count: { select: { sprintTasks: true } },
        sprintTasks: {
          select: {
            points: true,
            status: true,
            estimateHours: true,
          },
        },
      },
    });

    return sprints.map((sprint) => {
      const totalPoints = sprint.sprintTasks.reduce(
        (sum, t) => sum + (t.points || 0),
        0,
      );
      const completedPoints = sprint.sprintTasks
        .filter((t) => t.status === "Completed" || t.status === "Done")
        .reduce((sum, t) => sum + (t.points || 0), 0);

      return {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        totalTasks: sprint.sprintTasks.length,
        totalPoints,
        completedPoints,
        velocity:
          sprint.status === "COMPLETED" && totalPoints > 0
            ? Math.round((completedPoints / totalPoints) * 100)
            : 0,
      };
    });
  }

  async getMilestoneMetrics(projectId: number, query?: AnalyticsQueryDto) {
    if (query?.projectId) {
      await this.checkProjectAccess(query.userId || 0, projectId);
    }
    const milestones = await this.prisma.milestone.findMany({
      where: projectId ? { projectId } : {},
      include: {
        tasks: {
          select: { status: true, points: true },
        },
      },
    });

    return milestones.map((m) => {
      const totalTasks = m.tasks.length;
      const completedTasks = m.tasks.filter(
        (t) => t.status === "Completed" || t.status === "Done",
      ).length;
      return {
        id: m.id,
        name: m.name,
        status: m.status,
        totalTasks,
        completedTasks,
        completionRate:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    });
  }

  async getTrendData(projectId: number, query?: AnalyticsQueryDto) {
    await this.checkProjectAccess(query?.userId || 0, projectId);
    const since = new Date();
    if (query?.groupBy === "week") {
      since.setDate(since.getDate() - 28);
    } else if (query?.groupBy === "month") {
      since.setMonth(since.getMonth() - 3);
    }

    const activities = await this.prisma.activityLog.findMany({
      where: {
        projectId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "asc" },
    });

    const trends: Record<string, number> = {};
    activities.forEach((activity) => {
      const date = activity.createdAt.toISOString().split("T")[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return {
      projectId,
      groupBy: query?.groupBy || "week",
      trendData: Object.entries(trends).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  async getAllProjectsDashboard(userId: number) {
    // Get all projects user has access to
    const memberships = await this.prisma.projectMembership.findMany({
      where: { userId, status: "ACTIVE" },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    if (projectIds.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        upcomingDeadlines: [],
        activeSprints: [],
        recentActivity: [],
        teamWorkload: [],
      };
    }

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      upcomingDeadlines,
      activeSprints,
      recentActivity,
      teamWorkload,
    ] = await Promise.all([
      this.prisma.project.count({ where: { id: { in: projectIds } } }),
      this.prisma.project.count({ where: { id: { in: projectIds }, archived: false, status: { not: "ARCHIVED" } } }),
      this.prisma.task.count({ where: { projectId: { in: projectIds } } }),
      this.prisma.task.count({ where: { projectId: { in: projectIds }, status: { in: ["Completed", "Done"] } } }),
      this.prisma.task.count({ where: { projectId: { in: projectIds }, status: "In Progress" } }),
      this.prisma.task.count({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: new Date() },
          status: { not: { in: ["Completed", "Done"] } },
        },
      }),
      this.prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          dueDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          status: { not: { in: ["Completed", "Done"] } },
        },
        take: 10,
        orderBy: { dueDate: "asc" },
        select: { id: true, title: true, dueDate: true, projectId: true, project: { select: { name: true, key: true } } },
      }),
      this.prisma.sprint.findMany({
        where: { projectId: { in: projectIds }, status: "ACTIVE" },
        take: 5,
        include: { project: { select: { name: true, key: true } } },
      }),
      this.prisma.activityLog.findMany({
        where: { projectId: { in: projectIds } },
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { username: true } }, project: { select: { name: true, key: true } } },
      }),
      this.getTeamWorkload({ projectId: projectIds[0] }), // Simplified - use first project
    ]);

    return {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      upcomingDeadlines,
      activeSprints,
      recentActivity,
      teamWorkload,
    };
  }
}
