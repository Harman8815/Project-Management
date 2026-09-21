import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProjectDto {
  @ApiProperty({ example: "PROJ-1" })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({ example: "New Project" })
  @IsString()
  name: string;

  @ApiProperty({ example: "A project for X", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: "2024-01-01T00:00:00Z", required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: "2024-12-31T00:00:00Z", required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: "2025-06-30T00:00:00Z", required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiProperty({
    enum: ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"],
    default: "PLANNED",
    required: false,
  })
  @IsEnum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"])
  @IsOptional()
  status?: string;

  @ApiProperty({
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "MEDIUM",
    required: false,
  })
  @IsEnum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  @IsOptional()
  priority?: string;

  @ApiProperty({
    enum: ["ON_TRACK", "AT_RISK", "OFF_TRACK"],
    default: "ON_TRACK",
    required: false,
  })
  @IsEnum(["ON_TRACK", "AT_RISK", "OFF_TRACK"])
  @IsOptional()
  health?: string;

  @ApiProperty({ example: "Deliver MVP features", required: false })
  @IsString()
  @IsOptional()
  objectives?: string;
}
