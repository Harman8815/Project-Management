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
import { MilestonesService } from "./milestones.service";
import { CreateMilestoneDto, UpdateMilestoneDto } from "./dto/create-milestone.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess, RequireProjectRole } from "../../common/guards/project-access.guard";

@ApiTags("milestones")
@ApiBearerAuth()
@Controller("milestones")
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER", "MANAGER")
  async create(
    @Body() createMilestoneDto: CreateMilestoneDto,
    @CurrentUser() user: any,
  ) {
    return this.milestonesService.create(createMilestoneDto, user?.userId);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "projectId", required: false })
  @Get()
  async findAll(
    @Query() query: PaginationDto & { projectId?: number },
    @CurrentUser() user: any,
  ) {
    return this.milestonesService.findAll(query, user?.userId);
  }

  @Get(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.milestonesService.findOne(Number(id), user?.userId);
  }

  @Get(":id/completion")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async getCompletion(@Param("id") id: string, @CurrentUser() user: any) {
    return this.milestonesService.getCompletion(Number(id), user?.userId);
  }

  @Patch(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER", "MANAGER")
  async update(
    @Param("id") id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
    @CurrentUser() user: any,
  ) {
    return this.milestonesService.update(Number(id), updateMilestoneDto, user?.userId);
  }

  @Delete(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.milestonesService.remove(Number(id), user?.userId);
  }
}
