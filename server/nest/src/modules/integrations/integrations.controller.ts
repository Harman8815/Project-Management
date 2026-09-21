import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";

@Controller("organizations/:organizationId/integrations")
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Post()
  create(@Req() request: any, @Param("organizationId") organizationId: string, @Body() body: any) {
    return this.service.create(request.user.userId, Number(organizationId), body);
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
