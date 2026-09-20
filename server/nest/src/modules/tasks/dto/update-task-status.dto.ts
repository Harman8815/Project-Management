import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateTaskStatusDto {
  @ApiProperty({ example: "Completed" })
  @IsString()
  status: string;
}
