import { IsInt, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  projectId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  userId?: number;

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: "week" })
  @IsString()
  @IsOptional()
  groupBy?: string;
}
