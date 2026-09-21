import { IsInt, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class PortfolioQueryDto {
  @ApiPropertyOptional({ example: 1, description: "Filter by organization ID" })
  @IsInt()
  @IsOptional()
  organizationId?: number;

  @ApiPropertyOptional({ example: "ACTIVE", description: "Filter by project status" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: "HIGH", description: "Filter by priority" })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ example: "ON_TRACK", description: "Filter by health" })
  @IsString()
  @IsOptional()
  health?: string;

  @ApiPropertyOptional({ example: 1, description: "Filter by team ID" })
  @IsInt()
  @IsOptional()
  teamId?: number;

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsString()
  @IsOptional()
  endDate?: string;
}