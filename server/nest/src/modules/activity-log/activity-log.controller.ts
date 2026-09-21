import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ActivityLogService } from "./activity-log.service";
import { CreateActivityLogDto } from "./dto/create-activity-log.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("activity-log")
@ApiBearerAuth()
@Controller("activity-log")
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post()
  async create(@Body() createActivityLogDto: CreateActivityLogDto) {
    return this.activityLogService.create(createActivityLogDto);
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
  ) {
    return this.activityLogService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.activityLogService.findOne(Number(id));
  }
}
