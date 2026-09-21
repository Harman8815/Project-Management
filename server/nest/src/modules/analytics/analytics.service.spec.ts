import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";
import { NotFoundException } from "@nestjs/common";

describe("AnalyticsService", () => {
  let service: AnalyticsService;

  const mockPrismaService = {
    project: {
      findUnique: jest.fn(),
    },
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    sprint: {
      findMany: jest.fn(),
    },
    milestone: {
      findMany: jest.fn(),
    },
    activityLog: {
      findMany: jest.fn(),
    },
  };

  const mockProjectMembershipsService = {
    checkUserAccess: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ProjectMembershipsService,
          useValue: mockProjectMembershipsService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getProjectMetrics", () => {
    it("should return project metrics with health indicators", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 1,
        name: "Project 1",
      });
      mockPrismaService.task.count.mockImplementation(({ where }) => {
        const status = where?.status;
        const not = where?.status?.not;
        const inStatus = where?.status?.in;
        if (!status && !not && !inStatus) return 10;
        if (inStatus?.includes("Completed")) return 6;
        if (inStatus?.includes("Done")) return 6;
        if (status === "In Progress") return 3;
        if (status === "Blocked") return 1;
        return 0;
      });

      const result = await service.getProjectMetrics(1);

      expect(result).toEqual({
        projectId: 1,
        projectName: "Project 1",
        totalTasks: 10,
        completedTasks: 6,
        inProgressTasks: 3,
        blockedTasks: 1,
        overdueTasks: 0,
        openTasks: 0,
        completionRate: 60,
        overdueRate: 0,
        health: "ON_TRACK",
      });
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectMetrics(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should calculate OFF_TRACK health when overdue rate > 50%", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 1,
        name: "Project 1",
      });

      let callCount = 0;
      mockPrismaService.task.count.mockImplementation(({ where }) => {
        callCount++;
        if (callCount === 1) return 10;
        if (callCount === 2) return 2;
        if (callCount === 3) return 1;
        if (callCount === 4) return 1;
        if (callCount === 5) return 6;
        if (callCount === 6) return 8;
        return 0;
      });

      const result = await service.getProjectMetrics(1);

      expect(result.overdueRate).toBe(75);
      expect(result.health).toBe("OFF_TRACK");
    });
  });

  describe("getUserMetrics", () => {
    it("should return user metrics", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        userId: 1,
        username: "Alice",
      });

      mockPrismaService.task.count.mockImplementation(({ where }) => {
        if (where.assignedUserId && where.status?.in?.includes("Completed"))
          return 4;
        if (where.assignedUserId) return 8;
        if (where.authorUserId) return 5;
        return 0;
      });

      const result = await service.getUserMetrics(1);

      expect(result).toEqual({
        userId: 1,
        username: "Alice",
        assignedTasks: 8,
        authoredTasks: 5,
        completedAssigned: 4,
        completionRate: 50,
      });
    });

    it("should throw NotFoundException when user does not exist", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserMetrics(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getTeamWorkload", () => {
    it("should return workload data for all users", async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          userId: 1,
          username: "Alice",
          assignedTasks: [{ points: 5 }, { points: 3 }],
        },
        {
          userId: 2,
          username: "Bob",
          assignedTasks: [{ points: 8 }],
        },
      ]);

      const result = await service.getTeamWorkload();

      expect(result).toHaveLength(2);
      expect(result[0].username).toBe("Alice");
      expect(result[0].totalStoryPoints).toBe(8);
      expect(result[1].totalStoryPoints).toBe(8);
    });
  });

  describe("getSprintMetrics", () => {
    it("should return sprint metrics with velocity", async () => {
      mockPrismaService.sprint.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Sprint 1",
          status: "COMPLETED",
          sprintTasks: [
            { points: 5, status: "Completed" },
            { points: 3, status: "Completed" },
            { points: 2, status: "To Do" },
          ],
        },
      ]);

      const result = await service.getSprintMetrics(1);

      expect(result[0].velocity).toBe(80);
      expect(result[0].totalTasks).toBe(3);
      expect(result[0].totalPoints).toBe(10);
      expect(result[0].completedPoints).toBe(8);
    });
  });

  describe("getMilestoneMetrics", () => {
    it("should return milestone completion rates", async () => {
      mockPrismaService.milestone.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Q1",
          status: "PLANNED",
          tasks: [
            { status: "Completed", points: 5 },
            { status: "To Do", points: 3 },
            { status: "Completed", points: 2 },
          ],
        },
      ]);

      const result = await service.getMilestoneMetrics(1);

      expect(result[0].completionRate).toBe(67);
      expect(result[0].totalTasks).toBe(3);
      expect(result[0].completedTasks).toBe(2);
    });
  });

  describe("getTrendData", () => {
    it("should return trend data grouped by date", async () => {
      const mockDate = new Date("2024-01-15T10:30:00Z");
      mockPrismaService.activityLog.findMany.mockResolvedValue([
        { createdAt: mockDate, eventType: "TASK_CREATED" },
        { createdAt: mockDate, eventType: "TASK_UPDATED" },
        { createdAt: new Date("2024-01-20T10:30:00Z"), eventType: "TASK_CREATED" },
      ]);

      const result = await service.getTrendData(1, { groupBy: "week", userId: 1 });

      expect(result.trendData).toHaveLength(2);
      expect(result.trendData[0].count).toBe(2);
      expect(result.trendData[1].count).toBe(1);
    });
  });
});
