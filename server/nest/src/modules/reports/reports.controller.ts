import {
  Controller,
  Get,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ReportsService } from "./reports.service";
import { ReportQueryDto } from "./dto/report-query.dto";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiQuery({ name: "projectId", required: true })
  @ApiQuery({ name: "sprintId", required: false })
  @Get("burndown")
  async getBurndown(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getBurndownReport(
      Number(query.projectId),
      query.sprintId,
      user?.userId,
    );
  }

  @ApiQuery({ name: "projectId", required: true })
  @Get("burnup")
  async getBurnup(
    @Query("projectId") projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getBurnupReport(Number(projectId), user?.userId);
  }

  @ApiQuery({ name: "projectId", required: true })
  @Get("velocity")
  async getVelocity(
    @Query("projectId") projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getVelocityReport(Number(projectId), user?.userId);
  }

  @ApiQuery({ name: "projectId", required: true })
  @Get("risk")
  async getRisk(
    @Query("projectId") projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getRiskReport(Number(projectId), user?.userId);
  }

  @ApiQuery({ name: "projectId", required: true })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @Get("weekly-summary")
  async getWeeklySummary(
    @Query() query: ReportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getWeeklySummary(
      Number(query.projectId),
      query,
      user?.userId,
    );
  }
}
