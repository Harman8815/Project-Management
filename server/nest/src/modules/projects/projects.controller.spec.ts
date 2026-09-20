import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("ProjectsController", () => {
  let controller: ProjectsController;

  const mockPrismaService = {
    project: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    projectMembership: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a project", async () => {
      const createProjectDto = {
        name: "New Project",
        description: "A test project",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-12-31T00:00:00Z",
      };

      const expectedResult = {
        id: 1,
        ...createProjectDto,
      };

      mockPrismaService.project.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createProjectDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should return an array of projects with pagination meta", async () => {
      const expectedResult = {
        data: [
          {
            id: 1,
            name: "Project 1",
            description: "Description 1",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            tasks: [],
            projectTeams: [],
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      mockPrismaService.project.findMany.mockResolvedValue(expectedResult.data);
      mockPrismaService.project.count.mockResolvedValue(1);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should return a project by id", async () => {
      const expectedResult = {
        id: 1,
        name: "Project 1",
        description: "Description 1",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        tasks: [],
        projectTeams: [],
      };

      mockPrismaService.project.findUnique.mockResolvedValue(expectedResult);

      const result = await controller.findOne("1");

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          tasks: { include: { author: true, assignee: true } },
          projectTeams: true,
        },
      });
    });
  });

  describe("archive", () => {
    it("should archive a project", async () => {
      const mockProject = { id: 1, name: "Project 1" };
      const expectedResult = { ...mockProject, archived: true, status: "ARCHIVED" };

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.project.update.mockResolvedValue(expectedResult);

      const result = await controller.archive("1");

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { archived: true, status: "ARCHIVED" },
      });
    });

    it("should throw NotFoundException when project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(controller.archive("999")).rejects.toThrow(
        "Project with id 999 not found",
      );
    });
  });

  describe("restore", () => {
    it("should restore an archived project", async () => {
      const mockProject = { id: 1, archived: true, status: "ARCHIVED" };
      const expectedResult = { ...mockProject, archived: false, status: "ACTIVE" };

      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.project.update.mockResolvedValue(expectedResult);

      const result = await controller.restore("1");

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.project.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { archived: false, status: "ACTIVE" },
      });
    });

    it("should throw NotFoundException when archived project does not exist", async () => {
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      await expect(controller.restore("999")).rejects.toThrow(
        "Archived project with id 999 not found",
      );
    });
  });
});
