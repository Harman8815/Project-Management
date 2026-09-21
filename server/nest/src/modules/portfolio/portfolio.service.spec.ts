import { Test, TestingModule } from "@nestjs/testing";
import { PortfolioService } from "./portfolio.service";
import { PrismaService } from "../../prisma/prisma.service";

describe("PortfolioService", () => {
  let service: PortfolioService;

  const mockPrismaService = {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getPortfolioSummary", () => {
    it("should return portfolio summary with breakdowns", async () => {
      let callCount = 0;
      mockPrismaService.project.count.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(10);
        if (callCount === 2) return Promise.resolve(8);
        if (callCount === 3) return Promise.resolve(2);
        return Promise.resolve(0);
      });
      mockPrismaService.project.groupBy.mockResolvedValue([
        { status: "ACTIVE", _count: 8 },
        { status: "ARCHIVED", _count: 2 },
      ]);

      const result = await service.getPortfolioSummary({});

      expect(result.summary.totalProjects).toBe(10);
      expect(result.statusBreakdown).toHaveLength(2);
      expect(result.priorityBreakdown).toHaveLength(2);
      expect(result.healthBreakdown).toHaveLength(2);
    });
  });

  describe("getPortfolioProjects", () => {
    it("should return portfolio projects with details", async () => {
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
        },
      ]);

      const result = await service.getPortfolioProjects({});

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Project 1");
      expect(result[0].taskCount).toBe(5);
    });
  });

  describe("getProjectHealthOverview", () => {
    it("should return project health overview with risk scores", async () => {
      mockPrismaService.project.findMany.mockResolvedValue([
        {
          id: 1,
          key: "PROJ-1",
          name: "Project 1",
          status: "ACTIVE",
          health: "ON_TRACK",
          tasks: [
            {
              status: "In Progress",
              priority: "HIGH",
              dueDate: new Date(Date.now() - 86400000),
              points: 5,
            },
          ],
          milestones: [],
          sprints: [],
        },
      ]);

      const result = await service.getProjectHealthOverview({});

      expect(result).toHaveLength(1);
      expect(result[0].riskScore).toBeGreaterThan(0);
      expect(result[0].riskLevel).toBe("HIGH");
    });
  });
});