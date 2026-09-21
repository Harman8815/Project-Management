import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PortfolioService } from "./portfolio.service";
import { PortfolioQueryDto } from "./dto/portfolio-query.dto";

@ApiTags("portfolio")
@ApiBearerAuth()
@Controller("portfolio")
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get("summary")
  async getSummary(
    @Query() query: PortfolioQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.portfolioService.getPortfolioSummary(query);
  }

  @Get("projects")
  async getProjects(
    @Query() query: PortfolioQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.portfolioService.getPortfolioProjects(query);
  }

  @Get("health")
  async getHealth(
    @Query() query: PortfolioQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.portfolioService.getProjectHealthOverview(query);
  }
}