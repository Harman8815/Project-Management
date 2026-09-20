import { IsDateString, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTaskDto {
  @ApiProperty({ example: "Fix login page" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "Fix the login page responsiveness" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: "To Do" })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: "Medium" })
  @IsString()
  @IsOptional()
  priority?: string;

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
