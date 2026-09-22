import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SprintsService } from "./sprints.service";
import { CreateSprintDto, UpdateSprintDto } from "./dto/create-sprint.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess, RequireProjectRole } from "../../common/guards/project-access.guard";

@ApiTags("sprints")
@ApiBearerAuth()
@Controller("sprints")
@UseGuards(JwtAuthGuard)
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER", "MANAGER")
  async create(
    @Body() createSprintDto: CreateSprintDto,
    @CurrentUser() user: any,
  ) {
    return this.sprintsService.create(createSprintDto, user?.userId);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "projectId", required: false })
  @Get()
  async findAll(
    @Query() query: PaginationDto & { projectId?: number },
    @CurrentUser() user: any,
  ) {
    return this.sprintsService.findAll(query, user?.userId);
  }

  @Get(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sprintsService.findOne(Number(id), user?.userId);
  }

  @Get(":id/burndown")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async getBurndown(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sprintsService.getBurndown(Number(id), user?.userId);
  }

  @Patch(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER", "MANAGER")
  async update(
    @Param("id") id: string,
    @Body() updateSprintDto: UpdateSprintDto,
    @CurrentUser() user: any,
  ) {
    return this.sprintsService.update(Number(id), updateSprintDto, user?.userId);
  }

  @Delete(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.sprintsService.remove(Number(id), user?.userId);
  }
}
