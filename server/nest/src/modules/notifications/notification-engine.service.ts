import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { getRulesForEvent, interpolateTemplate, NotificationRule } from "./notification-rule";
import { NotificationType } from "./dto/create-notification.dto";

export interface ProcessEventPayload {
  taskId?: number;
  taskTitle?: string;
  projectId?: number;
  projectName?: string;
  sprintId?: number;
  sprintName?: string;
  dueDate?: string;
  authorId?: number;
  authorName?: string;
  assigneeUserId?: number;
  mentionedUserId?: number;
  newStatus?: string;
  daysRemaining?: number;
  organizationId?: number;
  actorId?: number;
  message?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async processEvent(eventType: string, payload: ProcessEventPayload): Promise<number> {
    const rules = getRulesForEvent(eventType);
    if (rules.length === 0) {
      return 0;
    }

    let totalCreated = 0;

    for (const rule of rules) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const targetUserIds = await this.resolveTargetUsers(rule, payload);
          for (const targetUserId of targetUserIds) {
            if (await this.shouldSuppress(rule, payload, targetUserId)) {
              continue;
            }

            if (await this.isDuplicate(rule, payload, targetUserId)) {
              continue;
            }

            await this.prisma.notification.create({
              data: {
                userId: targetUserId,
                type: rule.notificationType as string,
                title: interpolateTemplate(rule.titleTemplate, payload),
                message: interpolateTemplate(rule.messageTemplate, payload),
                link: rule.actionUrlTemplate
                  ? interpolateTemplate(rule.actionUrlTemplate, payload)
                  : null,
                severity: this.getSeverity(rule.notificationType),
                status: "DELIVERED",
              },
            });
            totalCreated++;
          }
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.error(
              `[NotificationEngine] Failed to process event ${eventType} after ${maxAttempts} attempts:`,
              error instanceof Error ? error.message : error,
            );
          }
        }
      }
    }

    return totalCreated;
  }

  private async resolveTargetUsers(rule: NotificationRule, payload: ProcessEventPayload): Promise<number[]> {
    const actorId = payload.actorId ?? payload.authorId;

    switch (rule.targetUsers) {
      case "actor":
        return actorId ? [actorId] : [];
      case "specific":
        if (rule.specificUserIds) {
          return rule.specificUserIds(payload);
        }
        return [];
      case "all": {
        const users = await this.prisma.user.findMany({ select: { userId: true } });
        return users.map((u) => u.userId);
      }
      case "project_members": {
        if (!payload.projectId) return [];
        const memberships = await this.prisma.projectMembership.findMany({
          where: { projectId: payload.projectId, status: "ACTIVE" },
          select: { userId: true },
        });
        const memberIds = memberships.map((m) => m.userId);
        return memberIds.filter((uid) => uid !== actorId);
      }
      case "team": {
        if (!actorId) return [];
        const user = await this.prisma.user.findUnique({
          where: { userId: actorId },
          select: { teamId: true },
        });
        if (!user?.teamId) return [];
        const teamMembers = await this.prisma.team.findUnique({
          where: { id: user.teamId },
          select: { user: { select: { userId: true } } },
        });
        const teamUserIds = teamMembers?.user.map((u) => u.userId) ?? [];
        return teamUserIds.filter((uid) => uid !== actorId);
      }
      case "watchers": {
        if (!payload.taskId) return [];
        const watchers = await this.prisma.taskWatcher.findMany({
          where: { taskId: payload.taskId },
          select: { userId: true },
        });
        return watchers.map((w) => w.userId);
      }
      default:
        return [];
    }
  }

  private getSeverity(notificationType: NotificationType): string {
    if (["TASK_OVERDUE", "OVERDUE_ALERT"].includes(notificationType)) {
      return "ERROR";
    }
    if (["TASK_DUE_SOON", "SPRINT_ENDING"].includes(notificationType)) {
      return "WARNING";
    }
    return "INFO";
  }

  private async shouldSuppress(
    rule: NotificationRule,
    payload: ProcessEventPayload,
    targetUserId: number,
  ): Promise<boolean> {
    if (payload.actorId && targetUserId === payload.actorId) {
      return true;
    }

    const preference = await this.prisma.notificationPreference.findUnique({
      where: { userId: targetUserId },
    });

    if (preference && !preference.inAppEnabled) {
      return true;
    }

    return false;
  }

  private async isDuplicate(
    rule: NotificationRule,
    payload: ProcessEventPayload,
    targetUserId: number,
  ): Promise<boolean> {
    const duplicateCount = await this.prisma.notification.count({
      where: {
        userId: targetUserId,
        type: rule.notificationType as string,
        read: false,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000),
        },
      },
    });
    return duplicateCount > 0;
  }
}
