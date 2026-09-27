import { Controller, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { ProjectDuplicationService, DuplicateOptions } from "./project-duplication.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess, RequireProjectRole } from "../../common/guards/project-access.guard";

@ApiTags("project-duplication")
@ApiBearerAuth()
@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectDuplicationController {
  constructor(private readonly projectDuplicationService: ProjectDuplicationService) {}

  @Post(":id/duplicate")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("id")
  @RequireProjectRole("ADMIN", "OWNER")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        key: { type: "string" },
        include: {
          type: "object",
          properties: {
            includeTasks: { type: "boolean", default: true },
            includeTaskStructure: { type: "boolean", default: true },
            includeSprints: { type: "boolean", default: true },
            includeMilestones: { type: "boolean", default: true },
            includeWorkflows: { type: "boolean", default: false },
            includeCustomFields: { type: "boolean", default: true },
          },
        },
      },
      required: ["name", "key"],
    },
  })
  async duplicateProject(
    @Param("id") id: string,
    @Body() body: { name: string; key: string; include?: DuplicateOptions },
    @CurrentUser() user: any,
  ) {
    return this.projectDuplicationService.duplicate(
      Number(id),
      user.userId || user.sub,
      {
        name: body.name,
        key: body.key,
        include: body.include || {},
      },
    );
  }
}