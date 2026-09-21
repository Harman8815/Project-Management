import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { CustomFieldsService } from "./custom-fields.service";

@Controller("organizations/:organizationId/custom-fields")
export class CustomFieldsController {
  constructor(private readonly service: CustomFieldsService) {}

  @Post()
  create(@Req() request: any, @Param("organizationId") organizationId: string, @Body() body: any) {
    return this.service.create(request.user.userId, Number(organizationId), body);
  }

  @Get()
  list(@Req() request: any, @Param("organizationId") organizationId: string) {
    return this.service.list(request.user.userId, Number(organizationId));
  }

  @Post("values")
  setValue(@Req() request: any, @Body() body: { definitionId: number; projectId?: number; taskId?: number; value: string }) {
    return this.service.setValue(request.user.userId, body.definitionId, body);
  }

  @Get("values")
  values(@Req() request: any, @Param("organizationId") organizationId: string, @Query() query: { projectId?: string; taskId?: string; key?: string }) {
    return this.service.values(request.user.userId, Number(organizationId), {
      projectId: query.projectId ? Number(query.projectId) : undefined,
      taskId: query.taskId ? Number(query.taskId) : undefined,
      key: query.key,
    });
  }
}
