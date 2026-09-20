import { IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProjectMembershipDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  teamId: number;
}
