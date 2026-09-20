import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTeamDto {
  @ApiProperty({ example: "Engineering" })
  @IsString()
  teamName: string;
}
