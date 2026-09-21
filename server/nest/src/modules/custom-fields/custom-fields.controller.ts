import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
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
}
