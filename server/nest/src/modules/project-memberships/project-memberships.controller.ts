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
import { ProjectMembershipsService } from "./project-memberships.service";
import {
  CreateProjectMembershipDto,
  InviteProjectMemberDto,
} from "./dto/create-project-membership.dto";
import { UpdateProjectMembershipDto } from "./dto/update-project-membership.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { FilterSortDto } from "../../common/dto/filter-sort.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess, RequireProjectRole } from "../../common/guards/project-access.guard";

@ApiTags("project-memberships")
@ApiBearerAuth()
@Controller("project-memberships")
@UseGuards(JwtAuthGuard)
export class ProjectMembershipsController {
  constructor(
    private readonly projectMembershipsService: ProjectMembershipsService,
  ) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async create(
    @Body() createProjectMembershipDto: CreateProjectMembershipDto,
    @CurrentUser() user: any,
  ) {
    return this.projectMembershipsService.create(
      createProjectMembershipDto,
      user?.userId,
    );
  }

  @Post("invite")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async invite(
    @Body() inviteDto: InviteProjectMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.projectMembershipsService.invite(
      inviteDto.projectId,
      inviteDto.cognitoId,
      inviteDto.role,
      user?.userId,
    );
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "projectId", required: false })
  @ApiQuery({ name: "search", required: false })
  @Get()
  async findAll(
    @Query() query: PaginationDto & FilterSortDto,
    @CurrentUser() user: any,
  ) {
    return this.projectMembershipsService.findAll(query, user?.userId);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get("project/:projectId")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async findByProject(
    @Param("projectId") projectId: string,
    @Query() query: PaginationDto,
    @CurrentUser() user: any,
  ) {
    return this.projectMembershipsService.findByProject(
      Number(projectId),
      query,
      user?.userId,
    );
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get("user/:userId")
  async findByUser(
    @Param("userId") userId: string,
    @Query() query: PaginationDto,
    @CurrentUser() user: any,
  ) {
    // Users can only see their own memberships
    if (user?.userId !== Number(userId)) {
      throw new Error("Unauthorized");
    }
    return this.projectMembershipsService.findByUser(Number(userId), query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.projectMembershipsService.findOne(Number(id), user?.userId);
  }

  @Patch(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async update(
    @Param("id") id: string,
    @Body() updateProjectMembershipDto: UpdateProjectMembershipDto,
    @CurrentUser() user: any,
  ) {
    return this.projectMembershipsService.update(
      Number(id),
      updateProjectMembershipDto,
      user?.userId,
    );
  }

  @Delete(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.projectMembershipsService.remove(Number(id), user?.userId);
  }
}
