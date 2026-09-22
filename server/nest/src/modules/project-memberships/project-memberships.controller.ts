import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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

@ApiTags("project-memberships")
@ApiBearerAuth()
@Controller("project-memberships")
export class ProjectMembershipsController {
  constructor(
    private readonly projectMembershipsService: ProjectMembershipsService,
  ) {}

  @Post()
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
  ) {
    return this.projectMembershipsService.findAll(query);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get("project/:projectId")
  async findByProject(
    @Param("projectId") projectId: string,
    @Query() query: PaginationDto,
  ) {
    return this.projectMembershipsService.findByProject(
      Number(projectId),
      query,
    );
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get("user/:userId")
  async findByUser(
    @Param("userId") userId: string,
    @Query() query: PaginationDto,
  ) {
    return this.projectMembershipsService.findByUser(Number(userId), query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.projectMembershipsService.findOne(Number(id));
  }

  @Patch(":id")
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
  async remove(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.projectMembershipsService.remove(Number(id), user?.userId);
  }
}
