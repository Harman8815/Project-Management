import { Body, Controller, Get, Post, Put, Param, Delete, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CalendarService } from "./calendar.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("calendar")
@ApiBearerAuth()
@Controller("organizations/:organizationId/calendar")
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Post("sync")
  syncCalendar(
    @Param("organizationId") organizationId: string,
    @Body() body: { provider: string; calendarId: string; syncToken?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.syncCalendar(Number(organizationId), user?.userId, body);
  }

  @Get("events")
  getEvents(
    @Param("organizationId") organizationId: string,
    @Query() query: PaginationDto & { calendarId?: string; startDate?: string; endDate?: string },
    @CurrentUser() user: any,
  ) {
    return this.service.getEvents(Number(organizationId), user?.userId, query);
  }

  @Post("events")
  createEvent(
    @Param("organizationId") organizationId: string,
    @Body() body: { calendarId: string; title: string; startDate: string; endDate: string; description?: string; taskId?: number },
    @CurrentUser() user: any,
  ) {
    return this.service.createEvent(Number(organizationId), user?.userId, body);
  }

  @Put("events/:eventId")
  updateEvent(
    @Param("organizationId") organizationId: string,
    @Param("eventId") eventId: string,
    @Body() body: Partial<{ title: string; startDate: string; endDate: string; description?: string; status?: string }>,
    @CurrentUser() user: any,
  ) {
    return this.service.updateEvent(Number(organizationId), user?.userId, Number(eventId), body);
  }

  @Delete("events/:eventId")
  deleteEvent(
    @Param("organizationId") organizationId: string,
    @Param("eventId") eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteEvent(Number(organizationId), user?.userId, Number(eventId));
  }

  @Post("events/:eventId/link-task")
  linkEventToTask(
    @Param("organizationId") organizationId: string,
    @Param("eventId") eventId: string,
    @Body() body: { taskId: number },
    @CurrentUser() user: any,
  ) {
    return this.service.linkEventToTask(Number(organizationId), user?.userId, Number(eventId), body.taskId);
  }

  @Post("parse-ical")
  parseIcal(@Body() body: { ical: string }) {
    return this.service.parseIcal(body.ical);
  }

  @Post("webhook/verify")
  verifyWebhook(@Body() body: { payload: string; signature: string; secret: string }) {
    return this.service.verifyWebhook(body.payload, body.signature, body.secret);
  }
}