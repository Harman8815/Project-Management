import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum ExportFormat {
  CSV = "CSV",
  EXCEL = "EXCEL",
  PDF = "PDF",
}

export enum ExportType {
  TASKS = "TASKS",
  PROJECTS = "PROJECTS",
  MILESTONES = "MILESTONES",
  SPRINTS = "SPRINTS",
  ACTIVITY = "ACTIVITY",
}

export class ExportQueryDto {
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.CSV })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @ApiPropertyOptional({ enum: ExportType, default: ExportType.TASKS })
  @IsEnum(ExportType)
  @IsOptional()
  type?: ExportType;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  projectId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sprintId?: number;

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsString()
  @IsOptional()
  endDate?: string;
}