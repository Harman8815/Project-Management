import { IsString, IsOptional, IsBoolean, IsObject, IsInt } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProjectTemplateDto {
  @ApiProperty({ example: "Agile Sprint Template" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: "Default template for agile sprint projects" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: { priority: "MEDIUM", health: "ON_TRACK", taskStatuses: ["To Do", "In Progress", "Done"] },
  })
  @IsObject()
  @IsOptional()
  projectConfig?: Record<string, any>;
}

export class UpdateProjectTemplateDto extends CreateProjectTemplateDto {
  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  createdById?: number;
}
