import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationsService } from "../organizations/organizations.service";
import { createHmac, timingSafeEqual } from "crypto";

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService, private readonly organizations: OrganizationsService) {}

  async syncCalendar(organizationId: number, userId: number, data: { provider: string; calendarId: string; syncToken?: string }) {
    await this.organizations.assertRole(userId, organizationId);
    if (!["google", "microsoft", "caldav"].includes(data.provider)) {
      throw new BadRequestException("Unsupported calendar provider");
    }
    return (this.prisma as any).calendarSync.create({
      data: {
        organizationId,
        userId,
        provider: data.provider,
        calendarId: data.calendarId,
        syncToken: data.syncToken || null,
        lastSyncedAt: new Date(),
      },
    });
  }

  async getEvents(organizationId: number, userId: number, query: { calendarId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    await this.organizations.assertRole(userId, organizationId);
    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    const where: any = { organizationId };
    if (query.calendarId) where.calendarId = query.calendarId;
    if (query.startDate) where.startDate = { gte: new Date(query.startDate) };
    if (query.endDate) where.endDate = { lte: new Date(query.endDate) };

    const events = await (this.prisma as any).calendarEvent.findMany({
      where,
      skip,
      take,
      orderBy: { startDate: "asc" },
    });
    const total = await (this.prisma as any).calendarEvent.count({ where });
    return { data: events, meta: { total, page: query.page || 1, limit: take } };
  }

  async createEvent(organizationId: number, userId: number, data: { calendarId: string; title: string; startDate: string; endDate: string; description?: string; taskId?: number; status?: string }) {
    await this.organizations.assertRole(userId, organizationId);
    if (!data.title || !data.startDate || !data.endDate) {
      throw new BadRequestException("Title, startDate, and endDate are required");
    }
    return (this.prisma as any).calendarEvent.create({
      data: {
        organizationId,
        userId,
        calendarId: data.calendarId,
        title: data.title,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        description: data.description || null,
        taskId: data.taskId || null,
        status: data.status || "SCHEDULED",
      },
    });
  }

  async updateEvent(organizationId: number, userId: number, eventId: number, data: Partial<{ title: string; startDate: string; endDate: string; description?: string; status?: string }>) {
    await this.organizations.assertRole(userId, organizationId);
    const event = await (this.prisma as any).calendarEvent.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundException("Event not found");
    return (this.prisma as any).calendarEvent.update({ where: { id: eventId }, data: { ...data, updatedAt: new Date() } });
  }

  async deleteEvent(organizationId: number, userId: number, eventId: number) {
    await this.organizations.assertRole(userId, organizationId);
    const event = await (this.prisma as any).calendarEvent.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundException("Event not found");
    await (this.prisma as any).calendarEvent.delete({ where: { id: eventId } });
    return { message: "Event deleted successfully" };
  }

  async linkEventToTask(organizationId: number, userId: number, eventId: number, taskId: number) {
    await this.organizations.assertRole(userId, organizationId);
    const event = await (this.prisma as any).calendarEvent.findFirst({ where: { id: eventId, organizationId } });
    if (!event) throw new NotFoundException("Event not found");
    const task = await this.prisma.task.findFirst({ where: { id: taskId, project: { organizationId } } });
    if (!task) throw new NotFoundException("Task not found in organization");
    return (this.prisma as any).calendarEvent.update({
      where: { id: eventId },
      data: { taskId },
    });
  }

  parseIcal(ical: string) {
    return ical.split("BEGIN:VEVENT").slice(1).map((block) => {
      const read = (key: string) => block.match(new RegExp(`\\n${key}(?:;[^:]*)?:([^\\n\\r]+)`))?.[1]?.trim() || null;
      return {
        externalId: read("UID"),
        title: read("SUMMARY"),
        startDate: read("DTSTART"),
        endDate: read("DTEND"),
        description: read("DESCRIPTION"),
        location: read("LOCATION"),
        status: read("STATUS") || "CONFIRMED",
      };
    }).filter((event) => event.title && event.startDate);
  }

  verifyWebhook(payload: string, signature: string, secret: string) {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new BadRequestException("Invalid webhook signature");
    return true;
  }
}