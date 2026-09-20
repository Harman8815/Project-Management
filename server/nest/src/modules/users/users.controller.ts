import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Public } from "../../common/guards/jwt-auth.guard";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(":cognitoId")
  async findOne(@Param("cognitoId") cognitoId: string) {
    return this.usersService.findOne(cognitoId);
  }

  @Patch(":cognitoId")
  async update(
    @Param("cognitoId") cognitoId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(cognitoId, updateUserDto);
  }

  @Delete(":cognitoId")
  async remove(@Param("cognitoId") cognitoId: string) {
    return this.usersService.remove(cognitoId);
  }
}
