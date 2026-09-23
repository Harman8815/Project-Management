import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from "class-validator";

export class CreateCalendarEventDto {
  @ApiProperty({ description: "Calendar ID" })
  @IsString()
  @IsNotEmpty()
  calendarId: string;

  @ApiProperty({ description: "Event title" })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Event start date (ISO 8601)" })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: "Event end date (ISO 8601)" })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: "Event description", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Linked task ID", required: false })
  @IsNumber()
  @IsOptional()
  taskId?: number;
}