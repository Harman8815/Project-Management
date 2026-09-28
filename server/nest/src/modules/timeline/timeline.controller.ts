import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { ProjectsService } from "../projects/projects.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("timeline")
@ApiBearerAuth()
@Controller("timeline")
@UseGuards(JwtAuthGuard)
export class TimelineController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getTimeline(@Query("projectId") projectId?: string) {
    const parsed = Number(projectId);
    return this.projectsService.getTimeline(
      undefined,
      Number.isInteger(parsed) && parsed > 0 ? parsed : undefined,
    );
  }
}
