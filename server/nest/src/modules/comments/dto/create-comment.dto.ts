import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsNumber } from "class-validator";

export class CreateCommentDto {
  @ApiProperty({ description: "Comment text" })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: "Task ID" })
  @IsNumber()
  taskId: number;

  @ApiProperty({ description: "Parent comment ID for replies", required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;
}
