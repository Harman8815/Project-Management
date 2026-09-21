import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTaskDto {
  @ApiPropertyOptional({ example: "PROJ-42" })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiProperty({ example: "Fix login page" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "Fix the login page responsiveness" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: ["To Do", "In Progress", "In Review", "Completed", "Blocked"],
    default: "To Do",
  })
  @IsEnum(["To Do", "In Progress", "In Review", "Completed", "Blocked"])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  })
  @IsEnum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  })
  @IsEnum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  @IsOptional()
  severity?: string;

  @ApiPropertyOptional({
    enum: ["TASK", "BUG", "STORY", "EPIC"],
    default: "TASK",
  })
  @IsEnum(["TASK", "BUG", "STORY", "EPIC"])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: "frontend,urgent" })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ example: "2024-01-01T00:00:00Z" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-06-01T00:00:00Z" })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsInt()
  @IsOptional()
  estimateHours?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @IsOptional()
  actualHours?: number;

  @ApiPropertyOptional({ example: "Must be responsive on all devices" })
  @IsString()
  @IsOptional()
  acceptanceCriteria?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  authorUserId: number;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  assignedUserId?: number;
}
