import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ResourcesService } from "./resources.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("resources")
@ApiBearerAuth()
@Controller("resources")
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get("overview")
  async getOverview(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.resourcesService.getOverview(userId);
  }

  @Get("employees")
  async getEmployees(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.resourcesService.getEmployees(userId);
  }

  @Get("by-project")
  async getResourcesByProject(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.resourcesService.getResourcesByProject(userId);
  }

  @Get("by-skill")
  async getResourcesBySkill(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.resourcesService.getResourcesBySkill(userId);
  }

  @Get("bench")
  async getBenchCandidates(@CurrentUser() user: any) {
    const userId = user.userId || user.sub;
    return this.resourcesService.getBenchCandidates(userId);
  }
}