import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SavedViewsService, SavedViewData } from "./saved-views.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("saved-views")
@ApiBearerAuth()
@Controller("saved-views")
@UseGuards(JwtAuthGuard)
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  @Post()
  async create(
    @Body() data: SavedViewData,
    @CurrentUser() user: any,
  ) {
    return this.savedViewsService.create(user.userId || user.sub, data);
  }

  @Get()
  @ApiQuery({ name: "viewType", required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query("viewType") viewType?: string,
  ) {
    return this.savedViewsService.findAll(user.userId || user.sub, viewType);
  }

  @Get("default/:viewType")
  async getDefault(
    @Param("viewType") viewType: string,
    @CurrentUser() user: any,
  ) {
    return this.savedViewsService.getDefaultView(user.userId || user.sub, viewType);
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.savedViewsService.findOne(Number(id), user.userId || user.sub);
  }

  @Get(":id/execute")
  @ApiQuery({ name: "projectId", required: false })
  async execute(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Query("projectId") projectId?: string,
  ) {
    return this.savedViewsService.execute(
      user.userId || user.sub,
      Number(id),
      projectId ? { projectId: Number(projectId) } : undefined,
    );
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() data: Partial<SavedViewData>,
    @CurrentUser() user: any,
  ) {
    return this.savedViewsService.update(Number(id), user.userId || user.sub, data);
  }

  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ) {
    return this.savedViewsService.delete(Number(id), user.userId || user.sub);
  }
}