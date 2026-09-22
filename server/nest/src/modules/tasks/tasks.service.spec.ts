import { Test, TestingModule } from "@nestjs/testing";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { WorkflowService } from "./workflow/workflow.service";

describe("TasksService", () => {
  let service: TasksService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    taskDependency: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    taskWatcher: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    taskHistory: {
      create: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const mockWorkflowService = {
    validateTransition: jest.fn().mockReturnValue(true),
    getValidTransitions: jest.fn().mockReturnValue(["In Progress"]),
    getDefaultWorkflow: jest.fn(),
    getProjectWorkflow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: WorkflowService,
          useValue: mockWorkflowService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a task with new fields", async () => {
      const createTaskDto = {
        title: "Test Task",
        type: "BUG",
        priority: "HIGH",
        severity: "LOW",
        estimateHours: 4,
        acceptanceCriteria: "Must pass all tests",
      };

      const expectedResult = {
        id: 1,
        ...createTaskDto,
        author: {},
        assignee: {},
        children: [],
        watchers: [],
      };

      const mockTxPrisma = {
        task: { create: jest.fn().mockResolvedValue(expectedResult) },
        activityLog: { create: jest.fn().mockResolvedValue({ id: 1 }) },
      };
      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockTxPrisma),
      );

      await service.create(createTaskDto as any, 1);
    });

    it("should default type to TASK when not provided", async () => {
      const createTaskDto = {
        title: "Simple Task",
        projectId: 1,
        authorUserId: 1,
      };

      const mockTxPrisma = {
        task: { create: jest.fn().mockResolvedValue({ id: 1, type: "TASK" }) },
        activityLog: { create: jest.fn().mockResolvedValue({ id: 1 }) },
      };
      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockTxPrisma),
      );

      await service.create(createTaskDto as any, 1);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it("should create task without activity log when no actor", async () => {
      const createTaskDto = {
        title: "Solo Task",
        projectId: 1,
        authorUserId: 1,
      };

      const mockTxPrisma: Record<string, any> = {
        task: {
          create: jest.fn().mockResolvedValue({ id: 1, title: "Solo Task" }),
        },
      };
      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockTxPrisma),
      );

      await service.create(createTaskDto as any);

      expect(mockTxPrisma.activityLog).toBeUndefined();
    });
  });

  describe("addDependency", () => {
    it("should create a task dependency", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.taskDependency.findMany.mockResolvedValue([]);
      mockPrismaService.taskDependency.create.mockResolvedValue({
        id: 1,
        taskId: 1,
        blockedById: 2,
      });

      const result = await service.addDependency(1, 2);

      expect(result).toEqual({ id: 1, taskId: 1, blockedById: 2 });
    });

    it("should throw NotFoundException when task does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.addDependency(999, 2)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw when blockedBy task does not exist", async () => {
      mockPrismaService.task.findUnique
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(null);

      await expect(service.addDependency(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should prevent self-dependency", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.addDependency(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should detect and prevent circular dependencies", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.taskDependency.findMany.mockImplementation(
        async ({ where }: { where: Record<string, any> }) => {
          if (where.taskId === 1) {
            return [{ taskId: 1, blockedById: 3 }];
          }
          if (where.taskId === 3) {
            return [{ taskId: 3, blockedById: 2 }];
          }
          if (where.taskId === 2) {
            return [{ taskId: 2, blockedById: 1 }];
          }
          return [];
        },
      );

      await expect(service.addDependency(1, 2)).rejects.toThrow(
        "circular reference",
      );
    });
  });

  describe("removeDependency", () => {
    it("should remove a dependency", async () => {
      mockPrismaService.taskDependency.findFirst.mockResolvedValue({
        id: 1,
        taskId: 1,
        blockedById: 2,
      });
      mockPrismaService.taskDependency.delete.mockResolvedValue({
        id: 1,
      });

      const result = await service.removeDependency(1, 2);

      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException when dependency does not exist", async () => {
      mockPrismaService.taskDependency.findFirst.mockResolvedValue(null);

      await expect(service.removeDependency(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getDependencies", () => {
    it("should return dependencies for a task", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      const expected = [
        { id: 1, taskId: 1, blockedById: 2, blockedBy: { id: 2 } },
      ];
      mockPrismaService.taskDependency.findMany.mockResolvedValue(expected);

      const result = await service.getDependencies(1);

      expect(result).toEqual(expected);
    });
  });

  describe("addWatcher", () => {
    it("should add a watcher to a task", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue({ userId: 1 });
      mockPrismaService.taskWatcher.create.mockResolvedValue({
        id: 1,
        taskId: 1,
        userId: 1,
      });

      const result = await service.addWatcher(1, 1);

      expect(result).toEqual({ id: 1, taskId: 1, userId: 1 });
    });

    it("should throw NotFoundException when task does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.addWatcher(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException when user does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.addWatcher(1, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("removeWatcher", () => {
    it("should remove a watcher", async () => {
      mockPrismaService.taskWatcher.findFirst.mockResolvedValue({
        id: 1,
        taskId: 1,
        userId: 1,
      });
      mockPrismaService.taskWatcher.delete.mockResolvedValue({ id: 1 });

      const result = await service.removeWatcher(1, 1);

      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException when watcher does not exist", async () => {
      mockPrismaService.taskWatcher.findFirst.mockResolvedValue(null);

      await expect(service.removeWatcher(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getWatchers", () => {
    it("should return watchers for a task", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      const expected = [
        { id: 1, taskId: 1, userId: 1, user: { userId: 1, username: "Alice" } },
      ];
      mockPrismaService.taskWatcher.findMany.mockResolvedValue(expected);

      const result = await service.getWatchers(1);

      expect(result).toEqual(expected);
    });
  });

  describe("getChildren", () => {
    it("should return child tasks for a parent", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      const expected = [
        { id: 2, title: "Child Task", parentId: 1 },
      ];
      mockPrismaService.task.findMany.mockResolvedValue(expected);

      const result = await service.getChildren(1);

      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when parent does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.getChildren(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    it("should return tasks with filtering", async () => {
      const expected = [
        { id: 1, title: "Task 1", status: "To Do" },
      ];
      mockPrismaService.task.findMany.mockResolvedValue(expected);

      const result = await service.findAll(1, { status: "To Do" });

      expect(result).toEqual(expected);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 1, status: "To Do" }),
        }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a task by id", async () => {
      const expected = { id: 1, title: "Task" };
      mockPrismaService.task.findUnique.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when task does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateStatus", () => {
    it("should update task status with valid workflow transition", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 1,
        status: "In Progress",
        projectId: 1,
      });
      mockWorkflowService.validateTransition.mockReturnValue(true);

      const mockTxPrisma = {
        task: {
          update: jest.fn().mockResolvedValue({
            id: 1,
            status: "Completed",
          }),
        },
        taskHistory: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
        activityLog: {
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
      };
      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockTxPrisma),
      );

      const result = await service.updateStatus(1, { status: "Completed" }, 1);

      expect(result.status).toBe("Completed");
      expect(mockTxPrisma.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "Completed" },
        include: { author: true, assignee: true },
      });
      expect(mockTxPrisma.taskHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taskId: 1,
            field: "status",
            oldValue: "In Progress",
            newValue: "Completed",
          }),
        }),
      );
    });

    it("should throw NotFoundException when task does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(999, { status: "Completed" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException on invalid transition", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({
        id: 1,
        status: "Completed",
        projectId: 1,
      });
      mockWorkflowService.validateTransition.mockImplementation(() => {
        throw new BadRequestException("Invalid transition");
      });

      await expect(
        service.updateStatus(1, { status: "In Progress" }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update a task", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.task.update.mockResolvedValue({
        id: 1,
        title: "Updated Task",
      });

      const result = await service.update(1, { title: "Updated Task" } as any);

      expect(result.title).toBe("Updated Task");
    });
  });

  describe("remove", () => {
    it("should remove a task", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.task.delete.mockResolvedValue({ id: 1 });

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException when task does not exist", async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("getValidTransitions", () => {
    it("should return valid transitions for a status", () => {
      const result = service.getValidTransitions("To Do");
      expect(result).toEqual(["In Progress"]);
    });
  });

  describe("getDefaultWorkflow", () => {
    it("should return the default workflow", () => {
      const expected = { statuses: ["To Do"] };
      mockWorkflowService.getProjectWorkflow.mockReturnValue(expected);

      const result = service.getDefaultWorkflow();

      expect(result).toEqual(expected);
    });
  });
});
