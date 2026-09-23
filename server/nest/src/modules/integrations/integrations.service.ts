import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationsService } from "../organizations/organizations.service";

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService, private readonly organizations: OrganizationsService) {}

  async create(userId: number, organizationId: number, data: { provider: string; name: string; config?: Record<string, unknown>; secretRef?: string }) {
    await this.organizations.assertRole(userId, organizationId, ["OWNER", "ADMIN"]);
    return this.prisma.integration.create({ data: { organizationId, provider: data.provider, name: data.name, config: JSON.stringify(data.config || {}), secretRef: data.secretRef } });
  }

  async setCredentialRef(userId: number, organizationId: number, integrationId: number, secretRef: string) {
    await this.organizations.assertRole(userId, organizationId, ["OWNER", "ADMIN"]);
    if (!/^[A-Za-z0-9._-]+$/.test(secretRef)) throw new BadRequestException("Invalid credential reference");
    const integration = await this.prisma.integration.findFirst({ where: { id: integrationId, organizationId } });
    if (!integration) throw new NotFoundException("Integration not found");
    return this.prisma.integration.update({ where: { id: integrationId }, data: { secretRef } });
  }

  async getCredentialRef(userId: number, organizationId: number, integrationId: number) {
    await this.organizations.assertRole(userId, organizationId);
    const integration = await this.prisma.integration.findFirst({ where: { id: integrationId, organizationId }, select: { secretRef: true } });
    if (!integration) throw new NotFoundException("Integration not found");
    return { configured: Boolean(integration.secretRef) };
  }

  async exportProject(userId: number, organizationId: number, projectId: number) {
    await this.organizations.assertRole(userId, organizationId);
    const project = await this.prisma.project.findFirst({ where: { id: projectId, organizationId }, include: { tasks: true, milestones: true, sprints: true } });
    if (!project) throw new ForbiddenException("Project is outside your organization");
    return { version: 1, exportedAt: new Date().toISOString(), project };
  }

  async importProject(userId: number, organizationId: number, payload: { project: { name: string; description?: string; tasks?: Array<{ title: string; status?: string; priority?: string }> } }) {
    await this.organizations.assertRole(userId, organizationId, ["OWNER", "ADMIN"]);
    if (!payload?.project?.name) throw new BadRequestException("Project name is required");
    return this.prisma.project.create({
      data: {
        name: payload.project.name,
        description: payload.project.description,
        organizationId,
        tasks: { create: (payload.project.tasks || []).map((task) => ({ title: task.title, status: task.status || "To Do", priority: task.priority || "MEDIUM", authorUserId: userId })) },
      },
      include: { tasks: true },
    });
  }

  async providerActivity(userId: number, organizationId: number, integrationId: number) {
    await this.organizations.assertRole(userId, organizationId);
    const integration = await this.prisma.integration.findFirst({ where: { id: integrationId, organizationId } });
    if (!integration) throw new NotFoundException("Integration not found");
    if (!["github", "gitlab"].includes(integration.provider.toLowerCase())) throw new BadRequestException("Activity sync is supported for GitHub and GitLab");
    const secret = integration.secretRef ? process.env[`INTEGRATION_SECRET_${integration.secretRef.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}`] : undefined;
    if (!secret) throw new UnauthorizedException("Integration credential is not configured");
    const baseUrl = integration.provider.toLowerCase() === "github" ? "https://api.github.com" : "https://gitlab.com/api/v4";
    const response = await fetch(`${baseUrl}/events`, { headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" } });
    if (!response.ok) throw new BadRequestException(`Provider request failed with status ${response.status}`);
    return response.json();
  }

  async linkActivityToTask(userId: number, organizationId: number, taskId: number, event: { type: string; title: string; url?: string }) {
    await this.organizations.assertRole(userId, organizationId);
    const task = await this.prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    const membership = await this.prisma.projectMembership.findFirst({ where: { projectId: task?.projectId, userId, status: "ACTIVE" } });
    if (!task || task.project.organizationId !== organizationId || !membership) throw new ForbiddenException("You do not have access to this task");
    return this.prisma.activityLog.create({
      data: { eventType: "EXTERNAL_ACTIVITY_LINKED", actorId: userId, projectId: task.projectId, taskId, message: `${event.type}: ${event.title}`, metadata: JSON.stringify({ url: event.url }) },
    });
  }

  parseCalendarEvents(payload: string) {
    return payload.split("BEGIN:VEVENT").slice(1).map((block) => {
      const read = (key: string) => block.match(new RegExp(`\\n${key}(?:;[^:]*)?:([^\\n\\r]+)`))?.[1]?.trim() || null;
      return { uid: read("UID"), title: read("SUMMARY"), start: read("DTSTART"), end: read("DTEND") };
    }).filter((event) => event.uid && event.title && event.start);
  }

  verifyWebhook(payload: string, signature: string, secret: string) {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new UnauthorizedException("Invalid webhook signature");
    return true;
  }

  async queueEvent(integrationId: number, eventType: string, payload: unknown) {
    return this.prisma.integrationEvent.create({
      data: { integrationId, eventType, payload: JSON.stringify(payload) },
    });
  }

  async retryEvent(eventId: number, error: string) {
    const event = await this.prisma.integrationEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new UnauthorizedException("Integration event not found");
    const attempts = event.attempts + 1;
    return this.prisma.integrationEvent.update({
      where: { id: eventId },
      data: {
        attempts,
        lastError: error,
        status: attempts >= 5 ? "FAILED" : "RETRYING",
        nextAttemptAt: attempts >= 5 ? null : new Date(Date.now() + 2 ** attempts * 1000),
      },
    });
  }
}
