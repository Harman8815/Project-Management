import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ReportQueryDto } from "./dto/report-query.dto";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";

@Injectable()
export class ReportsService {
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

  async getBurndownReport(projectId: number, sprintId?: number, userId?: number) {
    if (userId) {
      await this.checkProjectAccess(userId, projectId);
    }
    let sprints;
    if (sprintId) {
      const sprint = await this.prisma.sprint.findUnique({
        where: { id: sprintId },
        include: {
          sprintTasks: {
            select: { points: true, estimateHours: true, status: true, createdAt: true },
          },
        },
      });
      if (!sprint) {
        throw new NotFoundException(`Sprint with id ${sprintId} not found`);
      }
      sprints = [sprint];
    } else {
      sprints = await this.prisma.sprint.findMany({
        where: { projectId },
        include: {
          sprintTasks: {
            select: { points: true, estimateHours: true, status: true, createdAt: true },
          },
        },
      });
    }

    return sprints.map((sprint) => {
      const totalPoints = sprint.sprintTasks.reduce(
        (sum, t) => sum + (t.points || 0),
        0,
      );

      const dailyProgress: Record<string, number> = {};
      sprint.sprintTasks.forEach((task) => {
        const date = task.createdAt.toISOString().split("T")[0];
        if (task.status === "Completed" || task.status === "Done") {
          dailyProgress[date] = (dailyProgress[date] || 0) + (task.points || 0);
        }
      });

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        status: sprint.status,
        totalPoints,
        dailyCompleted: Object.entries(dailyProgress).map(([date, points]) => ({
          date,
          completedPoints: points,
        })),
      };
    });
  }

  async getBurnupReport(projectId: number, userId?: number) {
    if (userId) {
      await this.checkProjectAccess(userId, projectId);
    }
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      select: {
        status: true,
        points: true,
        createdAt: true,
      },
    });

    const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);

    const dailyProgress: Record<string, { completed: number; total: number }> = {};

    tasks.forEach((task) => {
      const date = task.createdAt.toISOString().split("T")[0];
      if (!dailyProgress[date]) {
        dailyProgress[date] = { completed: 0, total: 0 };
      }
      if (task.status === "Completed" || task.status === "Done") {
        dailyProgress[date].completed += task.points || 0;
      }
      dailyProgress[date].total += task.points || 0;
    });

    return {
      projectId,
      totalPoints,
      dailyCumulated: Object.entries(dailyProgress)
        .map(([date, data]) => ({
          date,
          completedPoints: data.completed,
          totalPoints: data.total,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getVelocityReport(projectId: number, userId?: number) {
    if (userId) {
      await this.checkProjectAccess(userId, projectId);
    }
    const sprints = await this.prisma.sprint.findMany({
      where: { projectId, status: "COMPLETED" },
      include: {
        sprintTasks: {
          select: { points: true, status: true },
        },
      },
    });

    const velocities = sprints.map((sprint) => {
      const totalPoints = sprint.sprintTasks.reduce(
        (sum, t) => sum + (t.points || 0),
        0,
      );
      const completedPoints = sprint.sprintTasks
        .filter((t) => t.status === "Completed" || t.status === "Done")
        .reduce((sum, t) => sum + (t.points || 0), 0);

      return {
        sprintId: sprint.id,
        sprintName: sprint.name,
        velocity: totalPoints > 0
          ? Math.round((completedPoints / totalPoints) * 100)
          : 0,
        totalPoints,
        completedPoints,
      };
    });

    const avgVelocity =
      velocities.length > 0
        ? Math.round(
            velocities.reduce((sum, v) => sum + v.velocity, 0) / velocities.length,
          )
        : 0;

    return {
      projectId,
      averageVelocity: avgVelocity,
      sprintCount: velocities.length,
      sprints: velocities,
    };
  }

  async getRiskReport(projectId: number, userId?: number) {
    if (userId) {
      await this.checkProjectAccess(userId, projectId);
    }
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }

    const overdueTasks = await this.prisma.task.findMany({
      where: {
        projectId,
        dueDate: { lt: new Date() },
        status: { not: { in: ["Completed", "Done"] } },
      },
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        priority: true,
        assignedUserId: true,
      },
    });

    const blockedTasks = await this.prisma.task.findMany({
      where: {
        projectId,
        status: "Blocked",
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        assignedUserId: true,
      },
    });

    const highPriorityTasks = await this.prisma.task.findMany({
      where: {
        projectId,
        priority: { in: ["HIGH", "CRITICAL"] },
        status: { not: { in: ["Completed", "Done"] } },
      },
    });

    const totalTasks = await this.prisma.task.count({
      where: { projectId },
    });

    const weightedRisk =
      overdueTasks.length * 30 + blockedTasks.length * 20 + highPriorityTasks.length * 10;
    const maxPossible = totalTasks * 30;
    const riskScore =
      totalTasks > 0
        ? Math.min(100, Math.round((weightedRisk / maxPossible) * 100))
        : 0;

    return {
      projectId,
      riskScore,
      overdueTasks: overdueTasks.length,
      blockedTasks: blockedTasks.length,
      highPriorityTasks: highPriorityTasks.length,
      overdueTaskList: overdueTasks,
      blockedTaskList: blockedTasks,
      riskLevel: riskScore > 70 ? "HIGH" : riskScore > 40 ? "MEDIUM" : "LOW",
    };
  }

  async getWeeklySummary(projectId: number, query?: ReportQueryDto, userId?: number) {
    if (userId) {
      await this.checkProjectAccess(userId, projectId);
    }
    const startDate = query?.startDate
      ? new Date(query.startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = query?.endDate ? new Date(query.endDate) : new Date();

    const [
      tasksCreated,
      tasksCompleted,
      comments,
      activities,
      milestones,
    ] = await Promise.all([
      this.prisma.task.count({
        where: {
          projectId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.task.count({
        where: {
          projectId,
          status: { in: ["Completed", "Done"] },
          updatedAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.comment.count({
        where: {
          taskId: { in: (await this.prisma.task.findMany({
            where: { projectId },
            select: { id: true },
          })).map((t) => t.id) },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.activityLog.count({
        where: {
          projectId,
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.milestone.findMany({
        where: {
          projectId,
          dueDate: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          name: true,
          dueDate: true,
          status: true,
        },
      }),
    ]);

    return {
      projectId,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      tasksCreated,
      tasksCompleted,
      comments,
      activities,
      upcomingMilestones: milestones,
    };
  }
}
