import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ActivityLogService } from "./activity-log.service";
import { CreateActivityLogDto } from "./dto/create-activity-log.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess, RequireProjectRole } from "../../common/guards/project-access.guard";

@ApiTags("activity-log")
@ApiBearerAuth()
@Controller("activity-log")
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async create(
    @Body() createActivityLogDto: CreateActivityLogDto,
    @CurrentUser() user: any,
  ) {
    return this.activityLogService.create(createActivityLogDto, user?.userId);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "projectId", required: false })
  @ApiQuery({ name: "taskId", required: false })
  @ApiQuery({ name: "eventType", required: false })
  @ApiQuery({ name: "actorId", required: false })
  @ApiQuery({ name: "targetUserId", required: false })
  @Get()
  async findAll(
    @Query()
    query: PaginationDto & {
      projectId?: number;
      taskId?: number;
      eventType?: string;
      actorId?: number;
      targetUserId?: number;
    },
    @CurrentUser() user: any,
  ) {
    return this.activityLogService.findAll(query, user?.userId);
  }

  @Get(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.activityLogService.findOne(Number(id), user?.userId);
  }

  @Delete(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.activityLogService.delete(Number(id), user?.userId);
  }
}
