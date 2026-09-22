import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("ProjectsService", () => {
  let service: ProjectsService;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    projectMembership: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a project", async () => {
      const createDto = {
        name: "New Project",
        description: "A test project",
      };

      const createdProject = { id: 1, ...createDto };
      mockPrismaService.project.create.mockResolvedValue(createdProject);
      mockPrismaService.activityLog.create.mockResolvedValue({ id: 1 });
      mockPrismaService.projectMembership.create.mockResolvedValue({ id: 1 });

      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockPrismaService),
      );

      const result = await service.create(createDto, 1);

      expect(result).toEqual(createdProject);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.project.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: createDto }),
      );
      expect(mockPrismaService.projectMembership.create).toHaveBeenCalled();
      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "PROJECT_CREATED",
            projectId: 1,
            actorId: 1,
          }),
        }),
      );
    });

    it("should rollback on failure", async () => {
      mockPrismaService.$transaction.mockImplementation(
        async () => {
          throw new Error("Transaction failed");
        },
      );

      await expect(service.create({ name: "Test" }, 1)).rejects.toThrow(
        "Transaction failed",
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated projects", async () => {
      const projects = [{ id: 1, name: "Project 1" }];
      mockPrismaService.project.findMany.mockResolvedValue(projects);
      mockPrismaService.project.count.mockResolvedValue(1);
      mockPrismaService.projectMembership.findMany.mockResolvedValue([{ id: 1, userId: 1, projectId: 1, status: "ACTIVE" }]);

      const result = await service.findAll({ page: 1, limit: 10 }, 1);

      expect(result.data).toEqual(projects);
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 10 });
    });
  });

  describe("findOne", () => {
    it("should return a project by id", async () => {
      const expected = { id: 1, name: "Project 1" };
      mockPrismaService.project.findUnique.mockResolvedValue(expected);

      const result = await service.findOne(1);

      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update a project", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.project.update.mockResolvedValue({ id: 1, name: "Updated" });

      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockPrismaService),
      );

      const result = await service.update(1, { name: "Updated" } as any);

      expect(result.name).toBe("Updated");
      expect(mockPrismaService.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { name: "X" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should reject invalid status transition", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 1,
        status: "COMPLETED",
      });

      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockPrismaService),
      );

      await expect(service.update(1, { status: "ACTIVE" })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("remove", () => {
    it("should remove a project", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.project.delete.mockResolvedValue({ id: 1 });

      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockPrismaService),
      );

      const result = await service.remove(1);

      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("archive", () => {
    it("should archive a project", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1, name: "Project 1" });
      mockPrismaService.project.update.mockResolvedValue({
        id: 1,
        archived: true,
        status: "ARCHIVED",
      });
      mockPrismaService.activityLog.create.mockResolvedValue({ id: 1 });

      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockPrismaService),
      );

      const result = await service.archive(1);

      expect(result.archived).toBe(true);
      expect(result.status).toBe("ARCHIVED");
      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "PROJECT_ARCHIVED",
            projectId: 1,
          }),
        }),
      );
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.archive(999)).rejects.toThrow(
        "Project with id 999 not found",
      );
    });
  });

  describe("restore", () => {
    it("should restore an archived project", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue({
        id: 1,
        name: "Project 1",
        archived: true,
      });
      mockPrismaService.project.update.mockResolvedValue({
        id: 1,
        archived: false,
        status: "ACTIVE",
      });
      mockPrismaService.activityLog.create.mockResolvedValue({ id: 1 });

      mockPrismaService.$transaction.mockImplementation(
        async (fn: any) => fn(mockPrismaService),
      );

      const result = await service.restore(1);

      expect(result.archived).toBe(false);
      expect(result.status).toBe("ACTIVE");
      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType: "PROJECT_RESTORED",
            projectId: 1,
          }),
        }),
      );
    });

    it("should throw NotFoundException when project not found", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
