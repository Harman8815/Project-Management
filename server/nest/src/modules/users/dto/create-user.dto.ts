import { IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "alicejones" })
  @IsString()
  username: string;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174001" })
  @IsString()
  cognitoId: string;

  @ApiPropertyOptional({ example: "p1.jpeg" })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;
}
