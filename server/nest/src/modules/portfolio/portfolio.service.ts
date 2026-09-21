import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PortfolioQueryDto } from "./dto/portfolio-query.dto";

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhereClause(query: PortfolioQueryDto): any {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.health) {
      where.health = query.health;
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    return where;
  }

  async getPortfolioSummary(query: PortfolioQueryDto) {
    const where = this.buildWhereClause(query);

    const [totalProjects, activeProjects, archivedProjects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.count({ where: { ...where, archived: false } }),
      this.prisma.project.count({ where: { ...where, archived: true } }),
    ]);

    const statusCounts = await this.prisma.project.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    const priorityCounts = await this.prisma.project.groupBy({
      by: ["priority"],
      where,
      _count: true,
    });

    const healthCounts = await this.prisma.project.groupBy({
      by: ["health"],
      where,
      _count: true,
    });

    return {
      summary: {
        totalProjects,
        activeProjects,
        archivedProjects,
      },
      statusBreakdown: statusCounts.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      priorityBreakdown: priorityCounts.map((p) => ({
        priority: p.priority,
        count: p._count,
      })),
      healthBreakdown: healthCounts.map((h) => ({
        health: h.health,
        count: h._count,
      })),
    };
  }

  async getPortfolioProjects(query: PortfolioQueryDto) {
    const where = this.buildWhereClause(query);

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
            sprints: true,
          },
        },
      },
      orderBy: {
        name: "desc",
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
      members: project.members.map((m: any) => ({
        userId: m.userId,
        username: m.user.username,
        role: m.role,
      })),
      taskCount: project._count.tasks,
      milestoneCount: project._count.milestones,
      sprintCount: project._count.sprints,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));
  }

  async getProjectHealthOverview(query: PortfolioQueryDto) {
    const where = this.buildWhereClause(query);

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        tasks: {
          where: {
            status: { not: { in: ["Completed", "Done"] } },
          },
          select: {
            status: true,
            priority: true,
            dueDate: true,
            points: true,
          },
        },
        milestones: {
          where: {
            status: { not: { in: ["COMPLETED"] } },
          },
          select: {
            status: true,
            dueDate: true,
          },
        },
        sprints: {
          where: {
            status: { not: { in: ["COMPLETED"] } },
          },
          select: {
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    return projects.map((project: any) => {
      const totalTasks = project.tasks.length;
      const overdueTasks = project.tasks.filter(
        (t: any) => t.dueDate && new Date(t.dueDate) < new Date(),
      ).length;
      const blockedTasks = project.tasks.filter((t: any) => t.status === "Blocked").length;
      const highPriorityTasks = project.tasks.filter(
        (t: any) => t.priority === "HIGH" || t.priority === "CRITICAL",
      ).length;
      const upcomingMilestones = project.milestones.filter(
        (m: any) => m.dueDate && new Date(m.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ).length;
      const activeSprints = project.sprints.filter(
        (s: any) => s.status === "ACTIVE" || s.status === "PLANNED",
      ).length;

      const weightedRisk =
        overdueTasks * 30 + blockedTasks * 20 + highPriorityTasks * 10;
      const maxPossible = totalTasks * 30;
      const riskScore =
        totalTasks > 0
          ? Math.min(100, Math.round((weightedRisk / maxPossible) * 100))
          : 0;

      return {
        id: project.id,
        key: project.key,
        name: project.name,
        status: project.status,
        health: project.health,
        riskScore,
        riskLevel:
          riskScore > 70 ? "HIGH" : riskScore > 40 ? "MEDIUM" : "LOW",
        totalTasks,
        overdueTasks,
        blockedTasks,
        highPriorityTasks,
        upcomingMilestones,
        activeSprints,
      };
    });
  }
}