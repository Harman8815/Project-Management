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
import { CreateProjectMembershipDto } from "./dto/create-project-membership.dto";
import { UpdateProjectMembershipDto } from "./dto/update-project-membership.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("project-memberships")
@ApiBearerAuth()
@Controller("project-memberships")
export class ProjectMembershipsController {
  constructor(private readonly projectMembershipsService: ProjectMembershipsService) {}

  @Post()
  async create(@Body() createProjectMembershipDto: CreateProjectMembershipDto) {
    return this.projectMembershipsService.create(createProjectMembershipDto);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.projectMembershipsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.projectMembershipsService.findOne(Number(id));
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateProjectMembershipDto: UpdateProjectMembershipDto,
  ) {
    return this.projectMembershipsService.update(Number(id), updateProjectMembershipDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.projectMembershipsService.remove(Number(id));
  }
}
