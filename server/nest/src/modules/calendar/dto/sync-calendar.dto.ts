import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class SyncCalendarDto {
  @ApiProperty({ description: "Calendar provider (google, microsoft, caldav)" })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ description: "External calendar ID" })
  @IsString()
  @IsNotEmpty()
  calendarId: string;

  @ApiProperty({ description: "Sync token for incremental sync", required: false })
  @IsString()
  @IsOptional()
  syncToken?: string;
}