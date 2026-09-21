import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";

describe("UsersController", () => {
  let controller: UsersController;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a user", async () => {
      const dto: CreateUserDto = {
        username: "testuser",
        cognitoId: "test-cognito-id",
        profilePictureUrl: "p1.jpeg",
      };

      const expectedResult = {
        id: 1,
        username: "testuser",
        cognitoId: "test-cognito-id",
        profilePictureUrl: "p1.jpeg",
      };

      mockPrismaService.user.create.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          username: dto.username,
          cognitoId: dto.cognitoId,
          profilePictureUrl: dto.profilePictureUrl,
        },
      });
    });
  });

  describe("findAll", () => {
    it("should return an array of users with pagination meta", async () => {
      const expectedResult = {
        data: [
          {
            id: 1,
            username: "user1",
            cognitoId: "cognito1",
            assignedTasks: [],
            authoredTasks: [],
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      mockPrismaService.user.findMany.mockResolvedValue(expectedResult.data);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe("findOne", () => {
    it("should return a user by cognitoId", async () => {
      const cognitoId = "test-cognito-id";
      const expectedResult = {
        id: 1,
        username: "testuser",
        cognitoId,
        assignedTasks: [],
        authoredTasks: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(expectedResult);

      const result = await controller.findOne(cognitoId);

      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException for non-existent user", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(controller.findOne("non-existent")).rejects.toThrow(
        "User with cognitoId non-existent not found",
      );
    });
  });
});
