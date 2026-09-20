import { Test, TestingModule } from "@nestjs/testing";
import { ProjectTemplatesController } from "./project-templates.controller";
import { ProjectTemplatesService } from "./project-templates.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("ProjectTemplatesController", () => {
  let controller: ProjectTemplatesController;

  const mockPrismaService = {
    projectTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    project: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectTemplatesController],
      providers: [
        ProjectTemplatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ProjectTemplatesController>(
      ProjectTemplatesController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a project template", async () => {
      const createDto = {
        name: "Agile Template",
        description: "Default agile sprint template",
        isDefault: true,
        projectConfig: { priority: "MEDIUM" },
      };

      const expectedResult = {
        id: 1,
        name: createDto.name,
        description: createDto.description,
        isDefault: true,
        projectConfig: JSON.stringify(createDto.projectConfig),
      };

      mockPrismaService.projectTemplate.findFirst.mockResolvedValue(null);
      mockPrismaService.projectTemplate.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, { userId: 1 });

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.projectTemplate.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          description: createDto.description,
          isDefault: true,
          projectConfig: JSON.stringify(createDto.projectConfig),
          createdById: 1,
        },
      });
    });

    it("should unset existing default when creating a new default template", async () => {
      const createDto = {
        name: "New Default",
        isDefault: true,
      };

      const existingDefault = { id: 5, isDefault: true };

      mockPrismaService.projectTemplate.findFirst.mockResolvedValue(
        existingDefault,
      );
      mockPrismaService.projectTemplate.create.mockResolvedValue({
        id: 1,
        name: createDto.name,
        isDefault: true,
      });

      await controller.create(createDto, { userId: 1 });

      expect(mockPrismaService.projectTemplate.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { isDefault: false },
      });
    });
  });

  describe("findAll", () => {
    it("should return paginated templates", async () => {
      const expectedResult = {
        data: [
          { id: 1, name: "Template 1", isDefault: true },
          { id: 2, name: "Template 2", isDefault: false },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      mockPrismaService.projectTemplate.findMany.mockResolvedValue(
        expectedResult.data,
      );
      mockPrismaService.projectTemplate.count.mockResolvedValue(2);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should return a template by id", async () => {
      const expectedResult = {
        id: 1,
        name: "Template 1",
        description: "A template",
      };

      mockPrismaService.projectTemplate.findUnique.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findOne("1");

      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException when template does not exist", async () => {
      mockPrismaService.projectTemplate.findUnique.mockResolvedValue(null);

      await expect(controller.findOne("999")).rejects.toThrow(
        "ProjectTemplate with id 999 not found",
      );
    });
  });

  describe("createProjectFromTemplate", () => {
    it("should create a project from a template", async () => {
      const template = {
        id: 1,
        name: "Agile Template",
        projectConfig: JSON.stringify({
          priority: "MEDIUM",
          health: "ON_TRACK",
        }),
      };

      const expectedProject = {
        id: 2,
        name: "Agile Template Copy",
        priority: "MEDIUM",
        health: "ON_TRACK",
      };

      mockPrismaService.projectTemplate.findUnique.mockResolvedValue(template);
      mockPrismaService.project.create.mockResolvedValue(expectedProject);

      const result = await controller.createProjectFromTemplate("1", {});

      expect(result).toEqual(expectedProject);
    });

    it("should apply overrides when creating from template", async () => {
      const template = {
        id: 1,
        name: "Template",
        projectConfig: JSON.stringify({ priority: "MEDIUM" }),
      };

      mockPrismaService.projectTemplate.findUnique.mockResolvedValue(template);
      mockPrismaService.project.create.mockResolvedValue({ id: 2 });

      await controller.createProjectFromTemplate("1", {
        name: "Custom Project",
        priority: "HIGH",
      });

      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: {
          name: "Custom Project",
          description: undefined,
          startDate: undefined,
          endDate: undefined,
          dueDate: undefined,
          status: "PLANNED",
          priority: "HIGH",
          health: "ON_TRACK",
          objectives: undefined,
        },
      });
    });
  });

  describe("update", () => {
    it("should update a template", async () => {
      const updateDto = { name: "Updated Template" };

      mockPrismaService.projectTemplate.findUnique.mockResolvedValue({
        id: 1,
      });
      mockPrismaService.projectTemplate.update.mockResolvedValue({
        id: 1,
        ...updateDto,
      });

      const result = await controller.update("1", updateDto);

      expect(result).toEqual({ id: 1, ...updateDto });
    });
  });

  describe("remove", () => {
    it("should remove a template", async () => {
      mockPrismaService.projectTemplate.findUnique.mockResolvedValue({
        id: 1,
      });
      mockPrismaService.projectTemplate.delete.mockResolvedValue({
        id: 1,
      });

      const result = await controller.remove("1");

      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException when template does not exist", async () => {
      mockPrismaService.projectTemplate.findUnique.mockResolvedValue(null);

      await expect(controller.remove("999")).rejects.toThrow(
        "ProjectTemplate with id 999 not found",
      );
    });
  });
});
