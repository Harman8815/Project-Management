import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export class FilterSortDto {
  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.ASC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ example: "name" })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ example: "Active", description: "Filter by status" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: "HIGH", description: "Filter by priority" })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ example: "task", description: "Search query" })
  @IsString()
  @IsOptional()
  search?: string;
}
