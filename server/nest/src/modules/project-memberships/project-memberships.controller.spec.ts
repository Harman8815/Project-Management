import { Test, TestingModule } from "@nestjs/testing";
import { ProjectMembershipsController } from "./project-memberships.controller";
import { ProjectMembershipsService } from "./project-memberships.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("ProjectMembershipsController", () => {
  let controller: ProjectMembershipsController;

  const mockPrismaService = {
    projectMembership: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    project: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectMembershipsController],
      providers: [
        ProjectMembershipsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<ProjectMembershipsController>(
      ProjectMembershipsController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a project membership", async () => {
      const createDto = {
        projectId: 1,
        userId: 1,
        role: "MEMBER",
        status: "ACTIVE",
      };

      const expectedResult = {
        id: 1,
        ...createDto,
        user: { userId: 1 },
        project: { id: 1 },
      };

      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue({ userId: 1 });
      mockPrismaService.projectMembership.create.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.create(createDto);

      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException when project does not exist", async () => {
      const createDto = { projectId: 999, userId: 1 };

      mockPrismaService.project.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({ userId: 1 });

      await expect(controller.create(createDto)).rejects.toThrow(
        "Project with id 999 not found",
      );
    });
  });

  describe("invite", () => {
    it("should invite a user by cognitoId", async () => {
      const inviteDto = {
        projectId: 1,
        cognitoId: "123e4567-e89b-12d3-a456-426614174001",
        role: "MEMBER",
        invitedById: 1,
      };

      const user = { userId: 1, username: "testuser" };
      const expectedResult = {
        id: 1,
        projectId: 1,
        userId: user.userId,
        role: "MEMBER",
        status: "INVITED",
        user,
        project: { id: 1 },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.projectMembership.findFirst.mockResolvedValue(null);
      mockPrismaService.projectMembership.create.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.invite(inviteDto);

      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException when user cognitoId does not exist", async () => {
      const inviteDto = {
        projectId: 1,
        cognitoId: "non-existent-id",
        role: "MEMBER",
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(controller.invite(inviteDto)).rejects.toThrow(
        "User with cognitoId non-existent-id not found",
      );
    });

    it("should throw BadRequestException when user already a member", async () => {
      const inviteDto = {
        projectId: 1,
        cognitoId: "123e4567-e89b-12d3-a456-426614174001",
        role: "MEMBER",
      };

      const user = { userId: 1, username: "testuser" };
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.projectMembership.findFirst.mockResolvedValue({
        id: 1,
        userId: 1,
      });

      await expect(controller.invite(inviteDto)).rejects.toThrow(
        "is already a member",
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated memberships", async () => {
      const expectedResult = {
        data: [
          {
            id: 1,
            role: "MEMBER",
            user: { userId: 1, username: "Alice" },
            project: { id: 1, name: "Project 1" },
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockPrismaService.projectMembership.findMany.mockResolvedValue(
        expectedResult.data,
      );
      mockPrismaService.projectMembership.count.mockResolvedValue(1);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
    });
  });

  describe("findByProject", () => {
    it("should return memberships for a project", async () => {
      const expectedResult = {
        data: [
          {
            id: 1,
            role: "OWNER",
            user: { userId: 1 },
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      mockPrismaService.project.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaService.projectMembership.findMany.mockResolvedValue(
        expectedResult.data,
      );
      mockPrismaService.projectMembership.count.mockResolvedValue(1);

      const result = await controller.findByProject("1", {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe("findOne", () => {
    it("should return a membership by id", async () => {
      const expectedResult = {
        id: 1,
        role: "MEMBER",
        user: { userId: 1 },
        project: { id: 1 },
      };

      mockPrismaService.projectMembership.findUnique.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.findOne("1");

      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException when membership does not exist", async () => {
      mockPrismaService.projectMembership.findUnique.mockResolvedValue(null);

      await expect(controller.findOne("999")).rejects.toThrow(
        "ProjectMembership with id 999 not found",
      );
    });
  });

  describe("update", () => {
    it("should update a membership role", async () => {
      const updateDto = { role: "MANAGER" };

      const expectedResult = {
        id: 1,
        role: "MANAGER",
        user: { userId: 1 },
        project: { id: 1 },
      };

      mockPrismaService.projectMembership.findUnique.mockResolvedValue({
        id: 1,
      });
      mockPrismaService.projectMembership.update.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.update("1", updateDto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe("remove", () => {
    it("should remove a membership", async () => {
      mockPrismaService.projectMembership.findUnique.mockResolvedValue({
        id: 1,
      });
      mockPrismaService.projectMembership.delete.mockResolvedValue({
        id: 1,
      });

      const result = await controller.remove("1");

      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException when membership does not exist", async () => {
      mockPrismaService.projectMembership.findUnique.mockResolvedValue(null);

      await expect(controller.remove("999")).rejects.toThrow(
        "ProjectMembership with id 999 not found",
      );
    });
  });
});
