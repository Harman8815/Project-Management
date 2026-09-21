import { Test, TestingModule } from "@nestjs/testing";
import { ActivityLogService } from "./activity-log.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("ActivityLogService", () => {
  let service: ActivityLogService;

  const mockPrismaService = {
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivityLogService>(ActivityLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create an activity log entry", async () => {
      const createDto = {
        eventType: "TASK_CREATED" as const,
        message: "John created task 'Fix login'",
        actorId: 1,
        projectId: 1,
        taskId: 1,
        metadata: { title: "Fix login" },
      };

      const expected = {
        id: 1,
        eventType: "TASK_CREATED",
        message: createDto.message,
        actorId: 1,
        projectId: 1,
        taskId: 1,
        metadata: JSON.stringify(createDto.metadata),
        actor: { userId: 1, username: "John" },
      };

      mockPrismaService.activityLog.create.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result).toEqual(expected);
    });

    it("should serialize metadata as JSON string", async () => {
      const metadata = { oldStatus: "To Do", newStatus: "In Progress" };

      mockPrismaService.activityLog.create.mockResolvedValue({ id: 1 });

      await service.create({
        eventType: "TASK_STATUS_CHANGED",
        message: "Status changed",
        metadata,
      });

      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: JSON.stringify(metadata),
          }),
        }),
      );
    });

    it("should not set metadata when not provided", async () => {
      mockPrismaService.activityLog.create.mockResolvedValue({ id: 1 });

      await service.create({
        eventType: "TASK_CREATED",
        message: "Test",
      });

      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.not.objectContaining({ metadata: expect.any(String) }),
        }),
      );
    });
  });

  describe("logEvent", () => {
    it("should log an event with context", async () => {
      mockPrismaService.activityLog.create.mockResolvedValue({ id: 1 });

      await service.logEvent("TASK_CREATED", "Task created", {
        actorId: 1,
        projectId: 2,
      });

      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: "TASK_CREATED",
          message: "Task created",
          actorId: 1,
          projectId: 2,
        }),
        include: expect.anything(),
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated activity logs", async () => {
      const expected = {
        data: [
          {
            id: 1,
            eventType: "TASK_CREATED",
            message: "Task created",
            actor: { username: "John" },
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockPrismaService.activityLog.findMany.mockResolvedValue(expected.data);
      mockPrismaService.activityLog.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expected);
    });

    it("should filter by projectId", async () => {
      mockPrismaService.activityLog.findMany.mockResolvedValue([]);
      mockPrismaService.activityLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, projectId: 5 });

      expect(mockPrismaService.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 5 }),
        }),
      );
    });

    it("should filter by eventType", async () => {
      mockPrismaService.activityLog.findMany.mockResolvedValue([]);
      mockPrismaService.activityLog.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, eventType: "TASK_CREATED" });

      expect(mockPrismaService.activityLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ eventType: "TASK_CREATED" }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return an activity log by id", async () => {
      const expected = {
        id: 1,
        eventType: "TASK_CREATED",
        message: "Task created",
      };

      mockPrismaService.activityLog.findUnique.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when log does not exist", async () => {
      mockPrismaService.activityLog.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
