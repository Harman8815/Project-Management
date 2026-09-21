import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSprintDto {
  @ApiProperty({ example: "Sprint 1" })
  @IsString()
  name: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiPropertyOptional({ example: "Complete authentication flow" })
  @IsString()
  @IsOptional()
  goal?: string;

  @ApiPropertyOptional({ example: "2024-01-01T00:00:00Z" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-01-14T00:00:00Z" })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    enum: ["PLANNED", "ACTIVE", "COMPLETED"],
    default: "PLANNED",
  })
  @IsEnum(["PLANNED", "ACTIVE", "COMPLETED"])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 40 })
  @IsInt()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  ownerId?: number;
}

export class UpdateSprintDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(["PLANNED", "ACTIVE", "COMPLETED"])
  @IsOptional()
  status?: string;

  @IsInt()
  @IsOptional()
  capacity?: number;

  @IsInt()
  @IsOptional()
  ownerId?: number;
}
