import {
  Controller,
  Get,
  Param,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";

@ApiTags("analytics")
@ApiBearerAuth()
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiQuery({ name: "projectId", required: false })
  @Get("projects/:id/metrics")
  async getProjectMetrics(
    @Param("id") id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getProjectMetrics(Number(id), query);
  }

  @ApiQuery({ name: "projectId", required: false })
  @Get("users/:id/metrics")
  async getUserMetrics(
    @Param("id") id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getUserMetrics(Number(id), query);
  }

  @Get("teams/workload")
  async getTeamWorkload(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTeamWorkload(query);
  }

  @ApiQuery({ name: "projectId", required: false })
  @Get("sprints/metrics")
  async getSprintMetrics(@Query("projectId") projectId?: string) {
    return this.analyticsService.getSprintMetrics(
      projectId ? Number(projectId) : 0,
    );
  }

  @ApiQuery({ name: "projectId", required: false })
  @Get("milestones/metrics")
  async getMilestoneMetrics(@Query("projectId") projectId?: string) {
    return this.analyticsService.getMilestoneMetrics(
      projectId ? Number(projectId) : 0,
    );
  }

  @ApiQuery({ name: "projectId", required: true })
  @ApiQuery({ name: "groupBy", required: false })
  @Get("projects/:id/trends")
  async getTrendData(
    @Param("id") id: string,
    @Query("groupBy") groupBy: string = "week",
  ) {
    return this.analyticsService.getTrendData(Number(id), groupBy);
  }
}
