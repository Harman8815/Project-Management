import { IsInt, IsOptional, IsString, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class ReportQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  projectId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sprintId?: number;

  @ApiPropertyOptional({ example: "2024-01-01" })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: "2024-12-31" })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: "CSV" })
  @IsString()
  @IsOptional()
  format?: string;
}
