import { BadRequestException, Injectable } from "@nestjs/common";
import { OrganizationsService } from "../organizations/organizations.service";
import { PrismaService } from "../../prisma/prisma.service";

export type AiRequest = { projectId?: number; prompt: string; confirmMutation?: boolean };

@Injectable()
export class AiService {
  constructor(private readonly organizations: OrganizationsService, private readonly prisma: PrismaService) {}

  async answer(userId: number, organizationId: number, request: AiRequest) {
    await this.organizations.assertRole(userId, organizationId);
    if (!request.prompt || request.prompt.length > 4000) throw new BadRequestException("Prompt must be between 1 and 4000 characters");
    if (request.confirmMutation) throw new BadRequestException("AI mutations require an explicit action endpoint");
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
    const log = await this.prisma.aiRequestLog.create({ data: { userId, organizationId, projectId: request.projectId, feature: "answer", promptLength: request.prompt.length, status: "COMPLETED" } });
    return { requestId: log.id, status: "completed", answer, sources: project ? [{ type: "project", id: project.id }] : [], projectId: request.projectId };
  }

  async feedback(userId: number, requestId: number, rating: number, comment?: string) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new BadRequestException("Rating must be between 1 and 5");
    return this.prisma.aiFeedback.create({ data: { userId, requestId, rating, comment } });
  }
}
