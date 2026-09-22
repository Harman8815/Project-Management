import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateTaskStatusDto {
  @ApiProperty({
    example: "Completed",
    enum: ["To Do", "In Progress", "In Review", "Completed", "Blocked"],
  })
  @IsEnum(["To Do", "In Progress", "In Review", "Completed", "Blocked"])
  status: string;
}
