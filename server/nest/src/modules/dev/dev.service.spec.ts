import { Test, TestingModule } from "@nestjs/testing";
import { DevService } from "./dev.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ForbiddenException, BadRequestException } from "@nestjs/common";

describe("DevService", () => {
  let service: DevService;

  const idCounters: Record<string, number> = {};

  function makeIdCounter() {
    return function (model: string) {
      idCounters[model] = (idCounters[model] || 0) + 1;
      return idCounters[model];
    };
  }

  const getNextId = makeIdCounter();

  const mockPrismaService: any = {
    organization: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("organization"), ...args.data });
      }),
    },
    user: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        const userId = getNextId("user");
        return Promise.resolve({ userId, ...args.data });
      }),
    },
    team: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("team"), ...args.data });
      }),
    },
    project: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("project"), ...args.data });
      }),
    },
    projectMembership: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("projectMembership"), ...args.data });
      }),
    },
    organizationMembership: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("orgMembership"), ...args.data });
      }),
    },
    notificationPreference: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("notifPref"), ...args.data });
      }),
    },
    task: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("task"), ...args.data });
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    sprint: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("sprint"), ...args.data });
      }),
    },
    milestone: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("milestone"), ...args.data });
      }),
    },
    comment: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("comment"), ...args.data });
      }),
    },
    notification: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        return Promise.resolve({ id: getNextId("notification"), ...args.data });
      }),
    },
    $transaction: jest.fn(),
    $executeRawUnsafe: jest.fn().mockResolvedValue({}),
  };

  const originalAuthDisabled = process.env.AUTH_DISABLED;
  const originalDevKey = process.env.DEV_KEY;

  beforeEach(async () => {
    process.env.AUTH_DISABLED = "true";
    delete process.env.DEV_KEY;

    Object.keys(idCounters).forEach((k) => delete idCounters[k]);

    mockPrismaService.$transaction.mockImplementation((cb: any) => cb(mockPrismaService));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DevService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DevService>(DevService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.AUTH_DISABLED = originalAuthDisabled;
    if (originalDevKey) {
      process.env.DEV_KEY = originalDevKey;
    } else {
      delete process.env.DEV_KEY;
    }
  });

  describe("populate", () => {
    it("should generate data with small scale", async () => {
      const counts = await service.populate("small");

      expect(counts).toBeDefined();
      expect(counts.users).toBe(5);
      expect(counts.projects).toBe(3);
      expect(counts.tasks).toBe(9);
      expect(counts.sprints).toBe(5);
      expect(counts.milestones).toBe(3);
      expect(counts.notifications).toBe(10);
      expect(counts.organizations).toBe(3);
      expect(counts.teams).toBe(5);
    });

    it("should generate data with medium scale", async () => {
      const counts = await service.populate("medium");

      expect(counts.users).toBe(10);
      expect(counts.projects).toBe(6);
      expect(counts.tasks).toBe(30);
      expect(counts.sprints).toBe(15);
      expect(counts.milestones).toBe(10);
      expect(counts.notifications).toBe(50);
    });

    it("should generate data with large scale", async () => {
      const counts = await service.populate("large");

      expect(counts.users).toBe(20);
      expect(counts.projects).toBe(10);
      expect(counts.tasks).toBe(40);
      expect(counts.sprints).toBe(30);
      expect(counts.milestones).toBe(25);
      expect(counts.notifications).toBe(200);
    });

    it("should throw ForbiddenException in production mode", async () => {
      process.env.AUTH_DISABLED = "false";
      delete process.env.DEV_KEY;
      service = new DevService(mockPrismaService as any);

      await expect(service.populate("small")).rejects.toThrow(ForbiddenException);
    });

    it("should allow access with valid DEV_KEY in production mode", async () => {
      process.env.AUTH_DISABLED = "false";
      process.env.DEV_KEY = "valid-key";
      service = new DevService(mockPrismaService as any);

      const counts = await service.populate("small", "valid-key");
      expect(counts.users).toBe(5);
    });

    it("should deny access with invalid DEV_KEY in production mode", async () => {
      process.env.AUTH_DISABLED = "false";
      process.env.DEV_KEY = "valid-key";
      service = new DevService(mockPrismaService as any);

      await expect(service.populate("small", "wrong-key")).rejects.toThrow(ForbiddenException);
    });

    it("should throw BadRequestException for invalid scale", async () => {
      await expect(service.populate("invalid" as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe("clear", () => {
    it("should clear specified models", async () => {
      mockPrismaService.notification.deleteMany = jest.fn().mockResolvedValue({ count: 5 });
      mockPrismaService.user.deleteMany = jest.fn().mockResolvedValue({ count: 3 });

      const result = await service.clear(["notifications", "users"]);

      expect(result.notifications).toBe(5);
      expect(result.users).toBe(3);
    });

    it("should throw BadRequestException when no models specified", async () => {
      await expect(service.clear([])).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for invalid model", async () => {
      await expect(service.clear(["invalidModel"])).rejects.toThrow(BadRequestException);
    });

    it("should throw ForbiddenException in production mode", async () => {
      process.env.AUTH_DISABLED = "false";
      delete process.env.DEV_KEY;
      service = new DevService(mockPrismaService as any);

      await expect(service.clear(["users"])).rejects.toThrow(ForbiddenException);
    });
  });

  describe("reset", () => {
    it("should reset and repopulate with given scale", async () => {
      Object.keys(mockPrismaService).forEach((key) => {
        if (typeof mockPrismaService[key] === "object" && mockPrismaService[key] !== null && !key.startsWith("$")) {
          if (!mockPrismaService[key].deleteMany) {
            mockPrismaService[key].deleteMany = jest.fn().mockResolvedValue({ count: 0 });
          }
        }
      });

      const counts = await service.reset("medium");

      expect(counts).toBeDefined();
      expect(counts.users).toBe(10);
      expect(counts.projects).toBe(6);
    });

    it("should throw ForbiddenException in production mode", async () => {
      process.env.AUTH_DISABLED = "false";
      delete process.env.DEV_KEY;
      service = new DevService(mockPrismaService as any);

      await expect(service.reset("small")).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getCurrentCounts", () => {
    it("should return counts for all models", async () => {
      mockPrismaService.organization.count.mockResolvedValue(3);
      mockPrismaService.user.count.mockResolvedValue(20);
      mockPrismaService.team.count.mockResolvedValue(5);
      mockPrismaService.project.count.mockResolvedValue(10);
      mockPrismaService.task.count.mockResolvedValue(40);
      mockPrismaService.sprint.count.mockResolvedValue(30);
      mockPrismaService.milestone.count.mockResolvedValue(25);
      mockPrismaService.comment.count.mockResolvedValue(35);
      mockPrismaService.notification.count.mockResolvedValue(200);

      const counts = await service.getCurrentCounts();

      expect(counts).toEqual({
        organizations: 3,
        users: 20,
        teams: 5,
        projects: 10,
        tasks: 40,
        sprints: 30,
        milestones: 25,
        comments: 35,
        notifications: 200,
      });
    });
  });

  describe("deterministic generation", () => {
    it("should produce same results on repeated runs (idempotency check)", async () => {
      const counts1 = await service.populate("small");
      Object.keys(idCounters).forEach((k) => delete idCounters[k]);
      jest.clearAllMocks();

      mockPrismaService.$transaction.mockImplementation((cb: any) => cb(mockPrismaService));

      const counts2 = await service.populate("small");

      expect(counts1).toEqual(counts2);
    });
  });
});
