import { Controller, Get, UseGuards } from "@nestjs/common";
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
  async getTimeline() {
    return this.projectsService.getTimeline();
  }
}
