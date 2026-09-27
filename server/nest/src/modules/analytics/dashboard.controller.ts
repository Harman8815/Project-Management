import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("dashboard")
@ApiBearerAuth()
@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("all-projects")
  @ApiQuery({ name: "userId", required: false })
  async getAllProjectsDashboard(@CurrentUser() user: any, @Query("userId") userId?: number) {
    const targetUserId = userId || user.userId || user.sub;
    return this.analyticsService.getAllProjectsDashboard(targetUserId);
  }
}