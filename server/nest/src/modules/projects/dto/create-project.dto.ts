import { IsDateString, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProjectDto {
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
}
