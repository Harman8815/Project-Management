import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { Public } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  @HttpCode(201)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Get(":cognitoId")
  async findOne(@Param("cognitoId") cognitoId: string) {
    return this.usersService.findOne(cognitoId);
  }

  @Get("me")
  async me(@CurrentUser() user: any) {
    const cognitoId = user?.cognitoId ?? user?.sub;
    return this.usersService.findOne(cognitoId);
  }

  @Patch(":cognitoId")
  async update(
    @Param("cognitoId") cognitoId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(cognitoId, updateUserDto);
  }

  @Patch(":userId/notification-preferences")
  async updateNotificationPreferences(
    @Param("userId") userId: string,
    @Body() body: { emailEnabled?: boolean; inAppEnabled?: boolean; notificationType?: string },
  ) {
    return this.usersService.updateNotificationPreferences(Number(userId), body);
  }

  @Delete(":cognitoId")
  async remove(@Param("cognitoId") cognitoId: string) {
    return this.usersService.remove(cognitoId);
  }
}
