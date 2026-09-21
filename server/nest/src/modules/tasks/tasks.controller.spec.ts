import { Test, TestingModule } from "@nestjs/testing";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { PrismaService } from "../../prisma/prisma.service";
import { WorkflowService } from "./workflow/workflow.service";

describe("TasksController", () => {
  let controller: TasksController;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockWorkflowService = {
    validateTransition: jest.fn().mockReturnValue(true),
    getValidTransitions: jest.fn().mockReturnValue([]),
    getProjectWorkflow: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
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

    controller = module.get<TasksController>(TasksController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a task", async () => {
      const createTaskDto = {
        identifier: "PROJ-42",
        title: "New Task",
        description: "A test task",
        status: "TODO",
        priority: "MEDIUM",
        tags: "bug,urgent",
        points: 5,
        projectId: 1,
        authorUserId: 1,
        assignedUserId: 2,
      };

      const expectedResult = {
        id: 1,
        ...createTaskDto,
        author: { id: 1 },
        assignee: { id: 2 },
      };

      mockPrismaService.task.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createTaskDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should return tasks by project id", async () => {
      const expectedResult = [
        {
          id: 1,
          title: "Task 1",
          status: "TODO",
          priority: "MEDIUM",
          author: { id: 1 },
          assignee: { id: 2 },
          comments: [],
          attachments: [],
        },
      ];

      mockPrismaService.task.findMany.mockResolvedValue(expectedResult);

      const result = await controller.findAll(1, {});

      expect(result).toEqual(expectedResult);
    });
  });

  describe("updateStatus", () => {
    it("should update task status", async () => {
      const updateTaskStatusDto = { status: "IN_PROGRESS" };
      const expectedResult = {
        id: 1,
        title: "Task 1",
        status: "IN_PROGRESS",
        author: { id: 1 },
        assignee: { id: 2 },
      };

      mockPrismaService.task.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.task.update.mockResolvedValue(expectedResult);

      const result = await controller.updateStatus("1", updateTaskStatusDto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: "IN_PROGRESS" },
        include: { author: true, assignee: true },
      });
    });
  });
});
