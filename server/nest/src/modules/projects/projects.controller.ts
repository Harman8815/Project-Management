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
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess, RequireProjectRole } from "../../common/guards/project-access.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("projects")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() createProjectDto: CreateProjectDto, @CurrentUser() user: any) {
    return this.projectsService.create(createProjectDto, user?.userId);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get()
  async findAll(@Query() query: PaginationDto, @CurrentUser() user: any) {
    return this.projectsService.findAll(query, user?.userId);
  }

  @Get(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("id")
  async findOne(@Param("id") id: string) {
    return this.projectsService.findOne(Number(id));
  }

  @Patch(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("id")
  @RequireProjectRole("ADMIN", "OWNER")
  async update(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.update(Number(id), updateProjectDto, user?.userId);
  }

  @Delete(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("id")
  @RequireProjectRole("ADMIN", "OWNER")
  async remove(@Param("id") id: string) {
    return this.projectsService.remove(Number(id));
  }

  @Patch(":id/archive")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("id")
  @RequireProjectRole("ADMIN", "OWNER")
  async archive(@Param("id") id: string, @CurrentUser() user: any) {
    return this.projectsService.archive(Number(id), user?.userId);
  }

  @Patch(":id/restore")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("id")
  @RequireProjectRole("ADMIN", "OWNER")
  async restore(@Param("id") id: string, @CurrentUser() user: any) {
    return this.projectsService.restore(Number(id), user?.userId);
  }
}
