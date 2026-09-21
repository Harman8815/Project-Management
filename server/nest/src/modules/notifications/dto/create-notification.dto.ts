import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const NOTIFICATION_TYPES = [
  "ASSIGNMENT",
  "MENTION",
  "STATUS_CHANGE",
  "COMMENT",
  "DUE_DATE_REMINDER",
  "OVERDUE_ALERT",
  "WORKFLOW_EVENT",
  "SYSTEM",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export class CreateNotificationDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ enum: NOTIFICATION_TYPES, example: "ASSIGNMENT" })
  @IsEnum(NOTIFICATION_TYPES)
  type: NotificationType;

  @ApiProperty({ example: "New task assigned to you" })
  @IsString()
  title: string;

  @ApiProperty({ example: "You have been assigned to task 'Fix login'" })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: "/tasks/1" })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  activityLogId?: number;
}
