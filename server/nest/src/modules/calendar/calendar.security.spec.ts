import { NotFoundException, BadRequestException } from "@nestjs/common";
import { CalendarService } from "./calendar.service";

describe("CalendarService Security & Permissions", () => {
  const makeService = (prisma: any, organizations: any) => new CalendarService(prisma as any, organizations as any);

  describe("syncCalendar - role enforcement", () => {
    it("allows member to sync calendar", async () => {
      const prisma = { calendarSync: { create: jest.fn().mockResolvedValue({ id: 1 }) } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await service.syncCalendar(2, 7, { provider: "google", calendarId: "cal-1" });
      expect(organizations.assertRole).toHaveBeenCalledWith(7, 2);
    });

    it("rejects unsupported provider", async () => {
      const prisma = { calendarSync: { create: jest.fn() } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.syncCalendar(2, 7, { provider: "unsupported", calendarId: "cal-1" })).rejects.toThrow(BadRequestException);
    });
  });

  describe("createEvent - validation", () => {
    it("rejects missing required fields", async () => {
      const prisma = { calendarSync: { create: jest.fn() }, calendarEvent: { create: jest.fn() } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.createEvent(2, 7, { calendarId: "cal-1", title: "", startDate: "", endDate: "" })).rejects.toThrow(BadRequestException);
    });
  });

  describe("updateEvent - ownership", () => {
    it("rejects update for non-existent event", async () => {
      const prisma = { calendarEvent: { findFirst: jest.fn().mockResolvedValue(null) } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.updateEvent(2, 7, 999, { title: "New" })).rejects.toThrow(NotFoundException);
    });
  });

  describe("deleteEvent - ownership", () => {
    it("rejects delete for non-existent event", async () => {
      const prisma = { calendarEvent: { findFirst: jest.fn().mockResolvedValue(null) } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.deleteEvent(2, 7, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("linkEventToTask - task scope check", () => {
    it("rejects linking to task outside organization", async () => {
      const prisma = {
        calendarEvent: { findFirst: jest.fn().mockResolvedValue({ id: 1, organizationId: 2 }) },
        task: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.linkEventToTask(2, 7, 1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("iCal parsing", () => {
    it("parses valid iCal events", () => {
      const prisma = {} as any;
      const organizations = {} as any;
      const service = makeService(prisma, organizations);
      const ical = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:evt-1\nSUMMARY:Meeting\nDTSTART:20240101T100000Z\nDTEND:20240101T110000Z\nDESCRIPTION:Team meeting\nEND:VEVENT\nEND:VCALENDAR`;
      const events = service.parseIcal(ical);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].title).toBe("Meeting");
      expect(events[0].startDate).toBe("20240101T100000Z");
    });

    it("filters incomplete events", () => {
      const prisma = {} as any;
      const organizations = {} as any;
      const service = makeService(prisma, organizations);
      const ical = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:evt-1\nEND:VEVENT\nEND:VCALENDAR`;
      const events = service.parseIcal(ical);
      expect(events.length).toBe(0);
    });
  });
});