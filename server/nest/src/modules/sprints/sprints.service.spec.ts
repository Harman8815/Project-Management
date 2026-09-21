import { Test, TestingModule } from "@nestjs/testing";
import { SprintsService } from "./sprints.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("SprintsService", () => {
  let service: SprintsService;

  const mockPrismaService = {
    sprint: {
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
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SprintsService>(SprintsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a sprint", async () => {
      const createDto = {
        name: "Sprint 1",
        projectId: 1,
        goal: "Complete auth",
        capacity: 40,
      };

      const expected = {
        id: 1,
        name: "Sprint 1",
        projectId: 1,
        status: "PLANNED",
        project: { id: 1 },
        sprintTasks: [],
      };

      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.sprint.create.mockResolvedValue(expected);

      const result = await service.create(createDto);

      expect(result).toEqual(expected);
    });
  });

  describe("findAll", () => {
    it("should return paginated sprints", async () => {
      const expected = {
        data: [{ id: 1, name: "Sprint 1" }],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockPrismaService.sprint.findMany.mockResolvedValue(expected.data);
      mockPrismaService.sprint.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expected);
    });
  });

  describe("findOne", () => {
    it("should return a sprint by id", async () => {
      const expected = { id: 1, name: "Sprint 1" };
      mockPrismaService.sprint.findUnique.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(result).toEqual(expected);
    });
  });

  describe("getBacklog", () => {
    it("should return tasks not assigned to any sprint", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      const expected = [{ id: 1, title: "Task 1", sprintId: null }];
      mockPrismaService.task.findMany.mockResolvedValue(expected);

      const result = await service.getBacklog(1);

      expect(result).toEqual(expected);
    });
  });

  describe("assignToSprint", () => {
    it("should assign a task to a sprint", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.sprint.findUnique.mockResolvedValue({ id: 1 });
      const expected = {
        id: 1,
        title: "Task 1",
        sprint: { id: 1 },
      };
      mockPrismaService.task.update.mockResolvedValue(expected);

      const result = await service.assignToSprint(1, 1);

      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { sprintId: 1 },
        include: {
          author: true,
          assignee: true,
          sprint: true,
        },
      });
      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when task does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.assignToSprint(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getBurndown", () => {
    it("should calculate sprint burndown data", async () => {
      mockPrismaService.sprint.findUnique.mockResolvedValue({
        id: 1,
        name: "Sprint 1",
        sprintTasks: [
          { points: 5, estimateHours: 8, status: "Completed" },
          { points: 3, estimateHours: 4, status: "To Do" },
          { points: 2, estimateHours: 2, status: "Completed" },
        ],
      });

      const result = await service.getBurndown(1);

      expect(result.totalPoints).toBe(10);
      expect(result.completedPoints).toBe(7);
      expect(result.remainingPoints).toBe(3);
      expect(result.completionRate).toBe(70);
    });
  });

  describe("update", () => {
    it("should update a sprint", async () => {
      mockPrismaService.sprint.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.sprint.update.mockResolvedValue({
        id: 1,
        name: "Updated Sprint",
      });

      const result = await service.update(1, { name: "Updated Sprint" });

      expect(result.name).toBe("Updated Sprint");
    });
  });

  describe("remove", () => {
    it("should remove a sprint", async () => {
      mockPrismaService.sprint.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.sprint.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1 });
    });
  });
});
