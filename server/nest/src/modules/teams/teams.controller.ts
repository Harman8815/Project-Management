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
import { TeamsService } from "./teams.service";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";

@ApiTags("teams")
@ApiBearerAuth()
@Controller("teams")
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  async create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  async findAll() {
    return this.teamsService.findAll();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.teamsService.findOne(Number(id));
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(Number(id), updateTeamDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.teamsService.remove(Number(id));
  }
}
