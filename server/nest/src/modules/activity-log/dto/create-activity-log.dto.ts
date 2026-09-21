import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const ACTIVITY_EVENT_TYPES = [
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_STATUS_CHANGED",
  "TASK_ASSIGNED",
  "TASK_UNASSIGNED",
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "PROJECT_ARCHIVED",
  "COMMENT_ADDED",
  "COMMENT_EDITED",
  "MENTION_ADDED",
  "FILE_UPLOADED",
  "DEPENDENCY_ADDED",
  "DEPENDENCY_REMOVED",
  "MEMBER_ADDED",
  "MEMBER_REMOVED",
  "ROLE_CHANGED",
  "SPRINT_STARTED",
  "SPRINT_COMPLETED",
] as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export class CreateActivityLogDto {
  @ApiProperty({
    enum: ACTIVITY_EVENT_TYPES,
    example: "TASK_CREATED",
  })
  eventType: ActivityEventType;

  @ApiProperty({ example: "John created task 'Fix login'" })
  message: string;

  @ApiPropertyOptional({ example: 1 })
  actorId?: number;

  @ApiPropertyOptional({ example: 1 })
  projectId?: number;

  @ApiPropertyOptional({ example: 1 })
  taskId?: number;

  @ApiPropertyOptional({ example: 2 })
  targetUserId?: number;

  @ApiPropertyOptional({
    example: { oldStatus: "To Do", newStatus: "In Progress" },
  })
  metadata?: Record<string, any>;
}
