import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { MethodologyService, MethodologyKey, MethodologyConfig } from "./methodology.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess, RequireProjectRole } from "../../common/guards/project-access.guard";

@ApiTags("methodology")
@ApiBearerAuth()
@Controller("methodology")
@UseGuards(JwtAuthGuard)
export class MethodologyController {
  constructor(private readonly methodologyService: MethodologyService) {}

  @Get()
  async getAllMethodologies(): Promise<MethodologyConfig[]> {
    return this.methodologyService.getAllMethodologies();
  }

  @Get("default")
  async getDefaultMethodology(): Promise<any> {
    return this.methodologyService.getDefaultMethodology();
  }

  @Get(":key")
  async getMethodology(@Param("key") key: MethodologyKey): Promise<any> {
    return this.methodologyService.getMethodology(key);
  }

  @Get("project/:projectId")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  async getProjectMethodology(
    @Param("projectId") projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.methodologyService.getProjectMethodology(Number(projectId), user.userId || user.sub);
  }

  @Post("project/:projectId")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("projectId")
  @RequireProjectRole("ADMIN", "OWNER")
  async setProjectMethodology(
    @Param("projectId") projectId: string,
    @Body() body: { methodologyKey: MethodologyKey },
    @CurrentUser() user: any,
  ) {
    return this.methodologyService.setProjectMethodology(
      Number(projectId),
      user.userId || user.sub,
      body.methodologyKey,
    );
  }

  // Admin-only endpoints for managing methodology configs
  @Post()
  @UseGuards(ProjectAccessGuard)
  @RequireProjectRole("OWNER") // Organization owner
  async createMethodologyConfig(
    @Body() data: { name: string; key: MethodologyKey; config: any; isDefault?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.methodologyService.createMethodologyConfig(data);
  }

  @Patch(":key")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectRole("OWNER")
  async updateMethodologyConfig(
    @Param("key") key: MethodologyKey,
    @Body() data: { name?: string; config?: any; isDefault?: boolean },
    @CurrentUser() user: any,
  ) {
    return this.methodologyService.updateMethodologyConfig(key, data);
  }

  @Delete(":key")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectRole("OWNER")
  async deleteMethodologyConfig(
    @Param("key") key: MethodologyKey,
    @CurrentUser() user: any,
  ) {
    return this.methodologyService.deleteMethodologyConfig(key);
  }
}