import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";

@Controller("organizations/:organizationId/integrations")
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Post()
  create(@Req() request: any, @Param("organizationId") organizationId: string, @Body() body: any) {
    return this.service.create(request.user.userId, Number(organizationId), body);
  }

  @Post(":integrationId/credential")
  setCredential(@Req() request: any, @Param("organizationId") organizationId: string, @Param("integrationId") integrationId: string, @Body() body: { secretRef: string }) {
    return this.service.setCredentialRef(request.user.userId, Number(organizationId), Number(integrationId), body.secretRef);
  }

  @Get(":integrationId/credential")
  getCredential(@Req() request: any, @Param("organizationId") organizationId: string, @Param("integrationId") integrationId: string) {
    return this.service.getCredentialRef(request.user.userId, Number(organizationId), Number(integrationId));
  }

  @Get(":integrationId/activity")
  activity(@Req() request: any, @Param("organizationId") organizationId: string, @Param("integrationId") integrationId: string) {
    return this.service.providerActivity(request.user.userId, Number(organizationId), Number(integrationId));
  }

  @Post("project/export")
  exportProject(@Req() request: any, @Param("organizationId") organizationId: string, @Body() body: { projectId: number }) {
    return this.service.exportProject(request.user.userId, Number(organizationId), body.projectId);
  }

  @Post("project/import")
  importProject(@Req() request: any, @Param("organizationId") organizationId: string, @Body() body: any) {
    return this.service.importProject(request.user.userId, Number(organizationId), body);
  }

  @Post("webhook/verify")
  verify(@Body() body: { payload: string; signature: string; secret: string }) {
    return { valid: this.service.verifyWebhook(body.payload, body.signature, body.secret) };
  }

  @Post("events")
  queueEvent(@Body() body: { integrationId: number; eventType: string; payload: unknown }) {
    return this.service.queueEvent(body.integrationId, body.eventType, body.payload);
  }

  @Post("events/retry")
  retryEvent(@Body() body: { eventId: number; error: string }) {
    return this.service.retryEvent(body.eventId, body.error);
  }
}
