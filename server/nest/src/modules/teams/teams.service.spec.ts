import { Test, TestingModule } from "@nestjs/testing";
import { TeamsService } from "./teams.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("TeamsService", () => {
  let service: TeamsService;

  const mockPrismaService = {
    team: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a team", async () => {
      const createDto = { teamName: "Engineering" };

      mockPrismaService.team.create.mockResolvedValue({
        id: 1,
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toEqual({ id: 1, ...createDto });
    });
  });

  describe("findAll", () => {
    it("should return paginated teams with usernames", async () => {
      const teams = [
        {
          id: 1,
          teamName: "Engineering",
          productOwnerUserId: 1,
          projectManagerUserId: 2,
        },
      ];

      const users = [
        { userId: 1, username: "Alice" },
        { userId: 2, username: "Bob" },
      ];

      mockPrismaService.team.findMany.mockResolvedValue(teams);
      mockPrismaService.team.count.mockResolvedValue(1);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(users[0])
        .mockResolvedValueOnce(users[1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].productOwnerUsername).toBe("Alice");
      expect(result.data[0].projectManagerUsername).toBe("Bob");
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10 });
    });

    it("should return null usernames when users not found", async () => {
      const teams = [
        {
          id: 1,
          teamName: "Engineering",
          productOwnerUserId: 1,
          projectManagerUserId: 2,
        },
      ];

      mockPrismaService.team.findMany.mockResolvedValue(teams);
      mockPrismaService.team.count.mockResolvedValue(1);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data[0].productOwnerUsername).toBeNull();
      expect(result.data[0].projectManagerUsername).toBeNull();
    });
  });

  describe("findOne", () => {
    it("should return a team with usernames", async () => {
      const team = {
        id: 1,
        teamName: "Engineering",
        productOwnerUserId: 1,
        projectManagerUserId: 2,
      };

      mockPrismaService.team.findUnique.mockResolvedValue(team);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ userId: 1, username: "Alice" })
        .mockResolvedValueOnce({ userId: 2, username: "Bob" });

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(result.productOwnerUsername).toBe("Alice");
      expect(result.projectManagerUsername).toBe("Bob");
    });

    it("should throw NotFoundException when team does not exist", async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        "Team with id 999 not found",
      );
    });
  });

  describe("update", () => {
    it("should update a team", async () => {
      mockPrismaService.team.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.team.update.mockResolvedValue({ id: 1, teamName: "Dev" });

      const result = await service.update(1, { teamName: "Dev" });

      expect(result).toEqual({ id: 1, teamName: "Dev" });
    });
  });

  describe("remove", () => {
    it("should remove a team", async () => {
      mockPrismaService.team.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.team.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1 });
    });
  });
});
