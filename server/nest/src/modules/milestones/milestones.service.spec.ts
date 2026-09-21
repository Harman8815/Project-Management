import { Test, TestingModule } from "@nestjs/testing";
import { MilestonesService } from "./milestones.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("MilestonesService", () => {
  let service: MilestonesService;

  const mockPrismaService = {
    milestone: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestonesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a milestone", async () => {
      const createDto = {
        name: "Q1 Release",
        projectId: 1,
        startDate: "2024-01-01",
        dueDate: "2024-03-31",
      };

      const expected = {
        id: 1,
        name: "Q1 Release",
        projectId: 1,
        status: "PLANNED",
        project: { id: 1 },
        owner: null,
      };

      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.milestone.create.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: "Test", projectId: 999 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findAll", () => {
    it("should return paginated milestones", async () => {
      const expected = {
        data: [{ id: 1, name: "Milestone 1" }],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockPrismaService.milestone.findMany.mockResolvedValue(expected.data);
      mockPrismaService.milestone.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expected);
    });
  });

  describe("findOne", () => {
    it("should return a milestone by id", async () => {
      const expected = { id: 1, name: "Q1 Release" };
      mockPrismaService.milestone.findUnique.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when milestone does not exist", async () => {
      mockPrismaService.milestone.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getCompletion", () => {
    it("should calculate milestone completion rate", async () => {
      mockPrismaService.milestone.findUnique.mockResolvedValue({
        id: 1,
        name: "Q1 Release",
        tasks: [
          { status: "Completed" },
          { status: "Completed" },
          { status: "To Do" },
        ],
      });

      const result = await service.getCompletion(1);

      expect(result.totalTasks).toBe(3);
      expect(result.completedTasks).toBe(2);
      expect(result.completionRate).toBe(67);
    });

    it("should handle milestone with no tasks", async () => {
      mockPrismaService.milestone.findUnique.mockResolvedValue({
        id: 1,
        name: "Empty",
        tasks: [],
      });

      const result = await service.getCompletion(1);

      expect(result.totalTasks).toBe(0);
      expect(result.completionRate).toBe(0);
    });
  });

  describe("update", () => {
    it("should update a milestone", async () => {
      mockPrismaService.milestone.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.milestone.update.mockResolvedValue({
        id: 1,
        name: "Updated Milestone",
      });

      const result = await service.update(1, { name: "Updated Milestone" });

      expect(result.name).toBe("Updated Milestone");
    });

    it("should throw NotFoundException when milestone does not exist", async () => {
      mockPrismaService.milestone.findUnique.mockResolvedValue(null);

      await expect(
        service.update(999, { name: "Test" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should remove a milestone", async () => {
      mockPrismaService.milestone.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.milestone.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1 });
    });
  });
});
