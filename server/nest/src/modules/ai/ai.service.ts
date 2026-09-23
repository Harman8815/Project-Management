import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { OrganizationsService } from "../organizations/organizations.service";
import { PrismaService } from "../../prisma/prisma.service";

export type AiRequest = { projectId?: number; prompt: string; confirmMutation?: boolean; feature?: string };
export type AiModelConfig = { provider: string; model: string; apiKey?: string; maxTokens?: number; temperature?: number };

@Injectable()
export class AiService {
  constructor(private readonly organizations: OrganizationsService, private readonly prisma: PrismaService) {}

  async answer(userId: number, organizationId: number, request: AiRequest) {
    await this.organizations.assertRole(userId, organizationId);
    if (!request.prompt || request.prompt.length > 4000) throw new BadRequestException("Prompt must be between 1 and 4000 characters");
    if (request.confirmMutation) throw new BadRequestException("AI mutations require an explicit action endpoint");
    if (/ignore\s+(all|previous|prior)\s+instructions|reveal\s+(the|your)\s+system\s+prompt|developer\s+message/i.test(request.prompt)) {
      throw new BadRequestException("Prompt contains a disallowed instruction override");
    }
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const requestCount = await this.prisma.aiRequestLog.count({ where: { userId, organizationId, createdAt: { gte: since } } });
    if (requestCount >= 100) throw new BadRequestException("Daily AI request limit reached");
    const normalized = request.prompt.toLowerCase();
    const project = request.projectId
      ? await this.prisma.project.findUnique({ where: { id: request.projectId }, include: { tasks: true, milestones: true, sprints: true } })
      : null;
    if (request.projectId && (!project || !(await this.prisma.projectMembership.findFirst({ where: { projectId: request.projectId, userId } })))) {
      throw new BadRequestException("Project is outside your organization scope");
    }
    let answer = "I can help with project status, risks, tasks, milestones, and sprint planning.";
    if (project && (normalized.includes("summary") || normalized.includes("status"))) {
      const completed = project.tasks.filter((task) => task.status === "Completed" || task.status === "Done").length;
      answer = `${project.name} has ${project.tasks.length} tasks, ${completed} completed, ${project.milestones.length} milestones, and ${project.sprints.length} sprints.`;
    } else if (project && normalized.includes("risk")) {
      const overdue = project.tasks.filter((task) => task.dueDate && task.dueDate < new Date() && task.status !== "Completed" && task.status !== "Done").length;
      answer = `${project.name} currently has ${overdue} overdue open task${overdue === 1 ? "" : "s"}.`;
    }
    const log = await this.prisma.aiRequestLog.create({ data: { userId, organizationId, projectId: request.projectId, feature: request.feature || "answer", promptLength: request.prompt.length, status: "COMPLETED" } });
    return { requestId: log.id, status: "completed", answer, sources: project ? [{ type: "project", id: project.id }] : [], projectId: request.projectId };
  }

  async feedback(userId: number, requestId: number, rating: number, comment?: string) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new BadRequestException("Rating must be between 1 and 5");
    return this.prisma.aiFeedback.create({ data: { userId, requestId, rating, comment } });
  }

  async setModelConfig(organizationId: number, userId: number, config: AiModelConfig) {
    await this.organizations.assertRole(userId, organizationId, ["OWNER", "ADMIN"]);
    if (!config.provider || !config.model || (config.maxTokens !== undefined && config.maxTokens < 1)) {
      throw new BadRequestException("A valid AI provider, model, and token limit are required");
    }
    
    const setting = await this.prisma.organizationSetting.upsert({
      where: {
        organizationId_key: {
          organizationId,
          key: "ai_model_config",
        },
      },
      update: {
        value: JSON.stringify(config),
      },
      create: {
        organizationId,
        key: "ai_model_config",
        value: JSON.stringify(config),
      },
    });
    return setting;
  }

  async getModelConfig(organizationId: number, userId: number) {
    await this.organizations.assertRole(userId, organizationId);
    
    const setting = await this.prisma.organizationSetting.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: "ai_model_config",
        },
      },
    });
    
    if (!setting) {
      return {
        provider: "openai",
        model: "gpt-4",
        maxTokens: 2000,
        temperature: 0.7,
      };
    }
    
    return JSON.parse(setting.value);
  }

  async naturalLanguageSearch(userId: number, organizationId: number, query: string, projectId?: number) {
    await this.organizations.assertRole(userId, organizationId);
    if (!query.trim()) throw new BadRequestException("Search query is required");
    if (projectId) await this.assertProjectAccess(userId, organizationId, projectId);
    
    // Extract keywords from natural language query
    const keywords = this.extractKeywords(query);
    
    // Search tasks using keywords
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: projectId || undefined,
        project: projectId ? undefined : { organizationId },
        OR: [
          ...keywords.flatMap((keyword) => [{ title: { contains: keyword } }, { description: { contains: keyword } }]),
        ],
      },
      include: {
        assignee: true,
        project: true,
      },
      take: 10,
    });
    
    return {
      query,
      keywords,
      results: tasks,
      count: tasks.length,
    };
  }

  async generateReport(userId: number, organizationId: number, projectId: number, reportType: string) {
    await this.organizations.assertRole(userId, organizationId);
    await this.assertProjectAccess(userId, organizationId, projectId);
    if (!["status", "risk", "progress", "planning"].includes(reportType)) throw new BadRequestException("Unsupported report type");
    
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        milestones: true,
        sprints: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });
    
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    
    const report = this.generateProjectReport(project, reportType);
    
    return {
      projectId,
      reportType,
      generatedAt: new Date().toISOString(),
      report,
    };
  }

  async suggestTaskBreakdown(userId: number, organizationId: number, projectId: number, taskTitle: string, taskDescription?: string) {
    await this.organizations.assertRole(userId, organizationId);
    await this.assertProjectAccess(userId, organizationId, projectId);
    
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
      },
    });
    
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    
    // Generate task breakdown suggestions based on existing project structure
    const suggestions = this.generateBreakdownSuggestions(taskTitle, taskDescription, project.tasks);
    
    return {
      projectId,
      originalTask: { title: taskTitle, description: taskDescription },
      suggestions,
    };
  }

  async assistPlanning(userId: number, organizationId: number, projectId: number, timeframe: string, capacity?: number) {
    await this.organizations.assertRole(userId, organizationId);
    await this.assertProjectAccess(userId, organizationId, projectId);
    
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        milestones: true,
        sprints: true,
      },
    });
    
    if (!project) {
      throw new NotFoundException("Project not found");
    }
    
    const suggestions = this.generatePlanningSuggestions(project, timeframe, capacity);
    
    return {
      projectId,
      timeframe,
      capacity,
      suggestions,
    };
  }

  private extractKeywords(query: string): string[] {
    // Simple keyword extraction - in production, use NLP library
    const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"];
    const words = query.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }

  private async assertProjectAccess(userId: number, organizationId: number, projectId: number) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { organizationId: true } });
    const membership = await this.prisma.projectMembership.findFirst({ where: { projectId, userId, status: "ACTIVE" } });
    if (!project || project.organizationId !== organizationId || !membership) {
      throw new ForbiddenException("You do not have access to this project");
    }
  }

  private generateProjectReport(project: any, reportType: string): any {
    const completedTasks = project.tasks.filter((t: any) => t.status === "Completed" || t.status === "Done");
    const inProgressTasks = project.tasks.filter((t: any) => t.status === "In Progress");
    const totalPoints = project.tasks.reduce((sum: number, t: any) => sum + (t.points || 0), 0);
    const completedPoints = completedTasks.reduce((sum: number, t: any) => sum + (t.points || 0), 0);
    
    return {
      summary: {
        projectName: project.name,
        totalTasks: project.tasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        completionRate: project.tasks.length > 0 ? Math.round((completedTasks.length / project.tasks.length) * 100) : 0,
        totalStoryPoints: totalPoints,
        completedStoryPoints: completedPoints,
      },
      milestones: project.milestones.map((m: any) => ({
        name: m.name,
        status: m.status,
        dueDate: m.dueDate,
      })),
      sprints: project.sprints.map((s: any) => ({
        name: s.name,
        status: s.status,
        capacity: s.capacity,
      })),
      team: project.members.map((m: any) => ({
        username: m.user.username,
        role: m.role,
      })),
    };
  }

  private generateBreakdownSuggestions(title: string, description: string | undefined, existingTasks: any[]): any[] {
    const suggestions: Array<{ title: string; description: string; estimatedPoints: number; suggestedAssignee: null }> = [];
    const taskTypes = ["Research", "Design", "Development", "Testing", "Documentation", "Deployment"];
    
    taskTypes.forEach(type => {
      suggestions.push({
        title: `${type}: ${title}`,
        description: description ? `${type} phase for: ${description}` : `${type} phase for this task`,
        estimatedPoints: Math.max(1, Math.min(5, Math.ceil(title.length / 20))),
        suggestedAssignee: null,
      });
    });
    
    return suggestions;
  }

  private generatePlanningSuggestions(project: any, timeframe: string, capacity?: number): any[] {
    const suggestions: Array<{ type: string; recommendation: string; details: string }> = [];
    const pendingTasks = project.tasks.filter((t: any) => t.status !== "Completed" && t.status !== "Done");
    
    // Suggest creating sprints based on task count
    if (pendingTasks.length > 10) {
      suggestions.push({
        type: "sprint",
        recommendation: "Consider creating multiple sprints",
        details: `You have ${pendingTasks.length} pending tasks. Break them into sprints of 5-8 tasks each.`,
      });
    }
    
    // Suggest milestone creation
    if (project.milestones.length === 0 && pendingTasks.length > 5) {
      suggestions.push({
        type: "milestone",
        recommendation: "Create milestones for better tracking",
        details: "Add milestones to track major deliverables and progress.",
      });
    }
    
    // Capacity-based suggestions
    if (capacity) {
      const totalPoints = pendingTasks.reduce((sum: number, t: any) => sum + (t.points || 0), 0);
      const sprintsNeeded = Math.ceil(totalPoints / capacity);
      suggestions.push({
        type: "capacity",
        recommendation: `Plan for ${sprintsNeeded} sprints`,
        details: `With ${totalPoints} story points and ${capacity} capacity per sprint, you'll need ${sprintsNeeded} sprints.`,
      });
    }
    
    return suggestions;
  }
}
