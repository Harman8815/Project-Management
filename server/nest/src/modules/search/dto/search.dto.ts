import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SearchDto {
  @ApiProperty({ example: "Task" })
  @IsString()
  query: string;
}
