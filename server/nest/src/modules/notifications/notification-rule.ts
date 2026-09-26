import { NotificationType } from "./dto/create-notification.dto";

export interface NotificationRule {
  eventType: string;
  notificationType: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  actionUrlTemplate?: string;
  targetUsers: "actor" | "assignee" | "watchers" | "project_members" | "team" | "all" | "specific";
  specificUserIds?: (payload: any) => number[];
}

export const NOTIFICATION_RULES: NotificationRule[] = [
  {
    eventType: "TASK_CREATED",
    notificationType: "ASSIGNMENT",
    titleTemplate: "New task assigned to you",
    messageTemplate: "You have been assigned to task '{taskTitle}'",
    actionUrlTemplate: "/tasks/{taskId}",
    targetUsers: "specific",
    specificUserIds: (p) => (p.assigneeUserId ? [p.assigneeUserId] : []),
  },
  {
    eventType: "TASK_STATUS_CHANGED",
    notificationType: "STATUS_CHANGE",
    titleTemplate: "Task status changed",
    messageTemplate: "{authorName} changed status of '{taskTitle}' to {newStatus}",
    actionUrlTemplate: "/tasks/{taskId}",
    targetUsers: "specific",
    specificUserIds: (p) => (p.assigneeUserId ? [p.assigneeUserId] : []),
  },
  {
    eventType: "TASK_COMMENT",
    notificationType: "COMMENT",
    titleTemplate: "New comment on task",
    messageTemplate: "{authorName} commented on '{taskTitle}'",
    actionUrlTemplate: "/tasks/{taskId}",
    targetUsers: "watchers",
  },
  {
    eventType: "TASK_MENTION",
    notificationType: "MENTION",
    titleTemplate: "You were mentioned",
    messageTemplate: "{authorName} mentioned you in '{taskTitle}'",
    actionUrlTemplate: "/tasks/{taskId}",
    targetUsers: "specific",
    specificUserIds: (p) => (p.mentionedUserId ? [p.mentionedUserId] : []),
  },
  {
    eventType: "TASK_DUE_SOON",
    notificationType: "TASK_DUE_SOON",
    titleTemplate: "Task due soon",
    messageTemplate: "'{taskTitle}' is due on {dueDate}",
    actionUrlTemplate: "/tasks/{taskId}",
    targetUsers: "specific",
    specificUserIds: (p) => (p.assigneeUserId ? [p.assigneeUserId] : []),
  },
  {
    eventType: "TASK_OVERDUE",
    notificationType: "TASK_OVERDUE",
    titleTemplate: "Task overdue",
    messageTemplate: "'{taskTitle}' is overdue (was due on {dueDate})",
    actionUrlTemplate: "/tasks/{taskId}",
    targetUsers: "specific",
    specificUserIds: (p) => (p.assigneeUserId ? [p.assigneeUserId] : []),
  },
  {
    eventType: "PROJECT_UPDATED",
    notificationType: "PROJECT_UPDATED",
    titleTemplate: "Project updated",
    messageTemplate: "{authorName} updated project '{projectName}'",
    actionUrlTemplate: "/projects/{projectId}",
    targetUsers: "project_members",
  },
  {
    eventType: "SPRINT_STARTED",
    notificationType: "SPRINT_STARTED",
    titleTemplate: "Sprint started",
    messageTemplate: "Sprint '{sprintName}' has started",
    actionUrlTemplate: "/sprints/{sprintId}",
    targetUsers: "project_members",
  },
  {
    eventType: "SPRINT_ENDING",
    notificationType: "SPRINT_ENDING",
    titleTemplate: "Sprint ending soon",
    messageTemplate: "Sprint '{sprintName}' ends in {daysRemaining} day(s)",
    actionUrlTemplate: "/sprints/{sprintId}",
    targetUsers: "project_members",
  },
];

export function getRulesForEvent(eventType: string): NotificationRule[] {
  return NOTIFICATION_RULES.filter((rule) => rule.eventType === eventType);
}

export function interpolateTemplate(template: string, payload: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = payload[key];
    return value !== undefined && value !== null ? String(value) : `{${key}}`;
  });
}
