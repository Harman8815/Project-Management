import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProjectMembershipDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({
    enum: ["OWNER", "MANAGER", "MEMBER", "VIEWER"],
    default: "MEMBER",
    required: false,
  })
  @IsEnum(["OWNER", "MANAGER", "MEMBER", "VIEWER"])
  @IsOptional()
  role?: string;

  @ApiProperty({
    enum: ["ACTIVE", "INVITED", "REMOVED"],
    default: "ACTIVE",
    required: false,
  })
  @IsEnum(["ACTIVE", "INVITED", "REMOVED"])
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  invitedById?: number;
}

export class InviteProjectMemberDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  projectId: number;

  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174001" })
  @IsString()
  cognitoId: string;

  @ApiProperty({
    enum: ["OWNER", "MANAGER", "MEMBER", "VIEWER"],
    default: "MEMBER",
    required: false,
  })
  @IsEnum(["OWNER", "MANAGER", "MEMBER", "VIEWER"])
  @IsOptional()
  role?: string;
}
