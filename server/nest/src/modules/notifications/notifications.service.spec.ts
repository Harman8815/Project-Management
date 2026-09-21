import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("NotificationsService", () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a notification", async () => {
      const createDto = {
        userId: 1,
        type: "ASSIGNMENT" as const,
        title: "New task assigned",
        message: "You have been assigned to task 'Fix login'",
        link: "/tasks/1",
      };

      const expected = { id: 1, ...createDto, read: false };

      mockPrismaService.notification.create.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result).toEqual(expected);
    });
  });

  describe("notifyUser", () => {
    it("should send notification to a user", async () => {
      mockPrismaService.notification.create.mockResolvedValue({ id: 1 });

      await service.notifyUser(
        1,
        "MENTION",
        "You were mentioned",
        "John mentioned you in a comment",
        "/tasks/1/comments",
        5,
      );

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          type: "MENTION",
          title: "You were mentioned",
          message: "John mentioned you in a comment",
          link: "/tasks/1/comments",
          activityLogId: 5,
        },
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated notifications", async () => {
      const expected = {
        data: [
          { id: 1, type: "ASSIGNMENT", read: false, title: "New task" },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockPrismaService.notification.findMany.mockResolvedValue(expected.data);
      mockPrismaService.notification.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expected);
    });

    it("should filter unread notifications when unreadOnly is true", async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, unreadOnly: true });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ read: false }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a notification by id", async () => {
      const expected = { id: 1, type: "ASSIGNMENT", read: false };
      mockPrismaService.notification.findUnique.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when notification does not exist", async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.notification.update.mockResolvedValue({
        id: 1,
        read: true,
      });

      const result = await service.markAsRead(1);

      expect(result.read).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications for a user as read", async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });
      mockPrismaService.notification.count.mockResolvedValue(8);

      const result = await service.markAllAsRead(1);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, read: false },
        data: { read: true },
      });
      expect(result.count).toBe(8);
    });
  });

  describe("getUnreadCount", () => {
    it("should return the count of unread notifications", async () => {
      mockPrismaService.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount(1);

      expect(result).toBe(3);
    });
  });

  describe("remove", () => {
    it("should remove a notification", async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.notification.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1 });
    });
  });
});
