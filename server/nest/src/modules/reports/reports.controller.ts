import {
  Controller,
  Get,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
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
  ) {
    return this.reportsService.getBurndownReport(
      Number(query.projectId),
      query.sprintId,
    );
  }

  @ApiQuery({ name: "projectId", required: true })
  @Get("burnup")
  async getBurnup(@Query("projectId") projectId: string) {
    return this.reportsService.getBurnupReport(Number(projectId));
  }

  @ApiQuery({ name: "projectId", required: true })
  @Get("velocity")
  async getVelocity(@Query("projectId") projectId: string) {
    return this.reportsService.getVelocityReport(Number(projectId));
  }

  @ApiQuery({ name: "projectId", required: true })
  @Get("risk")
  async getRisk(@Query("projectId") projectId: string) {
    return this.reportsService.getRiskReport(Number(projectId));
  }

  @ApiQuery({ name: "projectId", required: true })
  @ApiQuery({ name: "startDate", required: false })
  @ApiQuery({ name: "endDate", required: false })
  @Get("weekly-summary")
  async getWeeklySummary(@Query() query: ReportQueryDto) {
    return this.reportsService.getWeeklySummary(
      Number(query.projectId),
      query,
    );
  }
}
