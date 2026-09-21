import { Test, TestingModule } from "@nestjs/testing";
import { ExportService } from "./export.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";
import { ExportFormat, ExportType } from "./dto/export-query.dto";

describe("ExportService", () => {
  let service: ExportService;

  const mockPrismaService = {
    task: {
      findMany: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
    },
    milestone: {
      findMany: jest.fn(),
    },
    sprint: {
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
        ExportService,
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

    service = module.get<ExportService>(ExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("exportData", () => {
    it("should export tasks data as CSV", async () => {
      mockPrismaService.task.findMany.mockResolvedValue([
        {
          id: 1,
          title: "Task 1",
          description: "Test task",
          status: "To Do",
          priority: "HIGH",
          type: "TASK",
          points: 5,
          estimateHours: 8,
          actualHours: null,
          dueDate: null,
          projectId: 1,
          projectName: "Project 1",
          sprintId: null,
          sprintName: null,
          milestoneId: null,
          milestoneName: null,
          authorUsername: "alice",
          assigneeUsername: "bob",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ]);

      const result = await service.exportData({ type: ExportType.TASKS, format: ExportFormat.CSV, projectId: 1 });

      expect(result.format).toBe("CSV");
      expect(result.type).toBe("TASKS");
      expect(result.recordCount).toBe(1);
      expect(result.data).toContain("Task 1");
    });

    it("should export projects data", async () => {
      mockPrismaService.project.findMany.mockResolvedValue([
        {
          id: 1,
          key: "PROJ-1",
          name: "Project 1",
          description: "Test project",
          status: "ACTIVE",
          priority: "HIGH",
          health: "ON_TRACK",
          startDate: null,
          endDate: null,
          dueDate: null,
          archived: false,
          members: [],
          _count: {
            tasks: 5,
            milestones: 1,
            sprints: 1,
          },
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ]);

      const result = await service.exportData({ type: ExportType.PROJECTS, format: ExportFormat.CSV });

      expect(result.recordCount).toBe(1);
      expect(result.data).toContain("Project 1");
    });

    it("should export milestones data", async () => {
      mockPrismaService.milestone.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Milestone 1",
          description: "Test milestone",
          status: "PLANNED",
          projectId: 1,
          projectName: "Project 1",
          startDate: null,
          dueDate: new Date("2024-12-31"),
          ownerUsername: "alice",
          _count: { tasks: 5 },
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ]);

      const result = await service.exportData({ type: ExportType.MILESTONES, format: ExportFormat.CSV, projectId: 1 });

      expect(result.recordCount).toBe(1);
      expect(result.data).toContain("Milestone 1");
    });

    it("should export sprints data", async () => {
      mockPrismaService.sprint.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Sprint 1",
          goal: "Test sprint",
          status: "ACTIVE",
          projectId: 1,
          projectName: "Project 1",
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-14"),
          capacity: 40,
          ownerUsername: "alice",
          _count: { sprintTasks: 5 },
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ]);

      const result = await service.exportData({ type: ExportType.SPRINTS, format: ExportFormat.CSV, projectId: 1 });

      expect(result.recordCount).toBe(1);
      expect(result.data).toContain("Sprint 1");
    });

    it("should export activity data", async () => {
      mockPrismaService.activityLog.findMany.mockResolvedValue([
        {
          id: 1,
          eventType: "TASK_CREATED",
          actorUsername: "alice",
          projectId: 1,
          projectName: "Project 1",
          taskId: 1,
          taskTitle: "Task 1",
          targetUserId: null,
          message: "Task created",
          createdAt: new Date("2024-01-01"),
        },
      ]);

      const result = await service.exportData({ type: ExportType.ACTIVITY, format: ExportFormat.CSV, projectId: 1 });

      expect(result.recordCount).toBe(1);
      expect(result.data).toContain("TASK_CREATED");
    });

    it("should export as Excel format", async () => {
      mockPrismaService.task.findMany.mockResolvedValue([
        {
          id: 1,
          title: "Task 1",
          description: null,
          status: "To Do",
          priority: null,
          type: null,
          points: null,
          estimateHours: null,
          actualHours: null,
          dueDate: null,
          projectId: 1,
          projectName: null,
          sprintId: null,
          sprintName: null,
          milestoneId: null,
          milestoneName: null,
          authorUsername: null,
          assigneeUsername: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ]);

      const result = await service.exportData({ type: ExportType.TASKS, format: ExportFormat.EXCEL, projectId: 1 });

      expect(result.format).toBe("EXCEL");
      expect(result.data).toContain("Task 1");
    });

    it("should export as PDF format", async () => {
      mockPrismaService.task.findMany.mockResolvedValue([
        {
          id: 1,
          title: "Task 1",
          description: null,
          status: "To Do",
          priority: null,
          type: null,
          points: null,
          estimateHours: null,
          actualHours: null,
          dueDate: null,
          projectId: 1,
          projectName: null,
          sprintId: null,
          sprintName: null,
          milestoneId: null,
          milestoneName: null,
          authorUsername: null,
          assigneeUsername: null,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ]);

      const result = await service.exportData({ type: ExportType.TASKS, format: ExportFormat.PDF, projectId: 1 });

      expect(result.format).toBe("PDF");
      expect(result.data).toContain("Task 1");
    });
  });
});