import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProjectMetrics(projectId: number, query?: AnalyticsQueryDto) {
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

  async getSprintMetrics(projectId: number) {
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

  async getMilestoneMetrics(projectId: number) {
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

  async getTrendData(projectId: number, groupBy: string = "week") {
    const since = new Date();
    if (groupBy === "week") {
      since.setDate(since.getDate() - 28);
    } else if (groupBy === "month") {
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
      groupBy,
      trendData: Object.entries(trends).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }
}
