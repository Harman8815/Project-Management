import { Test, TestingModule } from "@nestjs/testing";
import { ReportsService } from "./reports.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";
import { NotFoundException } from "@nestjs/common";

describe("ReportsService", () => {
  let service: ReportsService;

  const mockPrismaService = {
    sprint: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    comment: {
      count: jest.fn(),
    },
    activityLog: {
      count: jest.fn(),
    },
    milestone: {
      findMany: jest.fn(),
    },
  };

  const mockProjectMembershipsService = {
    checkUserAccess: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
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

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getBurndownReport", () => {
    it("should return burndown data for a project", async () => {
      mockPrismaService.sprint.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Sprint 1",
          status: "COMPLETED",
          sprintTasks: [
            { points: 5, status: "Completed", createdAt: new Date("2024-01-01") },
            { points: 3, status: "To Do", createdAt: new Date("2024-01-02") },
          ],
        },
      ]);

      const result = await service.getBurndownReport(1);

      expect(result[0].sprintId).toBe(1);
      expect(result[0].totalPoints).toBe(8);
      expect(result[0].dailyCompleted).toHaveLength(1);
      expect(result[0].dailyCompleted[0].completedPoints).toBe(5);
    });

    it("should return burndown for a specific sprint", async () => {
      mockPrismaService.sprint.findUnique.mockResolvedValue({
        id: 1,
        name: "Sprint 1",
        status: "ACTIVE",
        sprintTasks: [],
      });

      const result = await service.getBurndownReport(1, 1);

      expect(result[0].sprintId).toBe(1);
    });
  });

  describe("getBurnupReport", () => {
    it("should return burnup data for a project", async () => {
      mockPrismaService.task.findMany.mockResolvedValue([
        { status: "Completed", points: 5, createdAt: new Date("2024-01-01") },
        { status: "To Do", points: 3, createdAt: new Date("2024-01-01") },
      ]);

      const result = await service.getBurnupReport(1);

      expect(result.totalPoints).toBe(8);
      expect(result.dailyCumulated).toHaveLength(1);
      expect(result.dailyCumulated[0].completedPoints).toBe(5);
    });
  });

  describe("getVelocityReport", () => {
    it("should return velocity with average", async () => {
      mockPrismaService.sprint.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Sprint 1",
          sprintTasks: [
            { points: 10, status: "Completed" },
            { points: 5, status: "Completed" },
            { points: 3, status: "To Do" },
          ],
        },
        {
          id: 2,
          name: "Sprint 2",
          sprintTasks: [
            { points: 8, status: "Completed" },
            { points: 2, status: "Completed" },
          ],
        },
      ]);

      const result = await service.getVelocityReport(1);

      expect(result.sprintCount).toBe(2);
      expect(result.sprints[0].velocity).toBe(83);
      expect(result.sprints[1].velocity).toBe(100);
      expect(result.averageVelocity).toBe(92);
    });
  });

  describe("getRiskReport", () => {
    it("should return risk assessment for a project", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.task.findMany.mockResolvedValueOnce([
        { id: 1, title: "Overdue Task", status: "In Progress", dueDate: new Date(), priority: "HIGH", assignedUserId: 1 },
      ]);
      mockPrismaService.task.findMany.mockResolvedValueOnce([
        { id: 2, title: "Blocked Task", status: "Blocked", priority: "MEDIUM", assignedUserId: 2 },
      ]);
      mockPrismaService.task.findMany.mockResolvedValueOnce([
        { id: 3, title: "High Priority", priority: "HIGH", status: "In Progress" },
      ]);
      mockPrismaService.task.count.mockResolvedValue(5);

      const result = await service.getRiskReport(1);

      expect(result.overdueTasks).toBe(1);
      expect(result.blockedTasks).toBe(1);
      expect(result.highPriorityTasks).toBe(1);
      expect(result.riskLevel).toBe("LOW");
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getRiskReport(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getWeeklySummary", () => {
    it("should return weekly project summary", async () => {
      mockPrismaService.task.count.mockResolvedValue(5);
      mockPrismaService.task.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockPrismaService.comment.count.mockResolvedValue(10);
      mockPrismaService.activityLog.count.mockResolvedValue(20);
      mockPrismaService.milestone.findMany.mockResolvedValue([
        { id: 1, name: "Q1", dueDate: new Date(), status: "PLANNED" },
      ]);

      const result = await service.getWeeklySummary(1);

      expect(result.tasksCreated).toBe(5);
      expect(result.comments).toBe(10);
      expect(result.activities).toBe(20);
      expect(result.upcomingMilestones).toHaveLength(1);
    });
  });
});
