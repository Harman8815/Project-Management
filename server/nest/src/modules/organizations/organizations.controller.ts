import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Post()
  create(@Req() request: any, @Body() body: { name: string; slug: string }) {
    return this.service.create(request.user.userId, body.name, body.slug);
  }

  @Get(":id")
  get(@Req() request: any, @Param("id") id: string) {
    return this.service.get(Number(id), request.user.userId);
  }

  @Post(":id/members")
  addMember(@Req() request: any, @Param("id") id: string, @Body() body: { userId: number; role?: string }) {
    return this.service.addMember(request.user.userId, Number(id), body.userId, body.role);
  }

  @Post(":id/settings")
  updateSettings(@Req() request: any, @Param("id") id: string, @Body() body: Record<string, string>) {
    return this.service.updateSettings(request.user.userId, Number(id), body);
  }

  @Post(":id/members/:userId/remove")
  removeMember(@Req() request: any, @Param("id") id: string, @Param("userId") userId: string) {
    return this.service.removeMember(request.user.userId, Number(id), Number(userId));
  }
}
