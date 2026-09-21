import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateMilestoneDto {
  @ApiProperty({ example: "Q1 Release" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "First quarter release milestone" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiPropertyOptional({ example: "2024-01-01T00:00:00Z" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-03-31T00:00:00Z" })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    enum: ["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"],
    default: "PLANNED",
  })
  @IsEnum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  ownerId?: number;
}

export class UpdateMilestoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  projectId?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(["PLANNED", "ACTIVE", "COMPLETED", "ARCHIVED"])
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  ownerId?: number;
}
