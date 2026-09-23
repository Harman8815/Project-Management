import { AiService } from "./ai.service";

describe("AiService Fallback Behavior", () => {
  describe("graceful fallback when project data is missing", () => {
    it("returns generic answer when project is null", async () => {
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const prisma = {
        project: { findUnique: jest.fn().mockResolvedValue(null) },
        projectMembership: { findFirst: jest.fn().mockResolvedValue(null) },
        aiRequestLog: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: 1 }) },
      };
      const service = new AiService(organizations as any, prisma as any);
      const result = await service.answer(7, 2, { prompt: "Give me a status summary" });
      expect(result.status).toBe("completed");
      expect(result.answer).toBeDefined();
      expect(result.sources).toEqual([]);
    });
  });

  describe("error isolation in report generation", () => {
    it("handles missing task statuses gracefully", async () => {
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const prisma = {
        project: {
          findUnique: jest.fn().mockResolvedValue({
            id: 1, organizationId: 2, name: "Test", tasks: [{ status: null, points: null }, { status: "Unknown", points: 5 }], milestones: [], sprints: [], members: [],
          }),
        },
        projectMembership: { findFirst: jest.fn().mockResolvedValue({ userId: 7, projectId: 1, status: "ACTIVE" }) },
        aiRequestLog: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: 1 }) },
      };
      const service = new AiService(organizations as any, prisma as any);
      const result = await service.generateReport(7, 2, 1, "status");
      expect(result.report.summary.totalTasks).toBe(2);
      expect(result.report.summary.completionRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe("model failure fallback", () => {
    it("returns fallback response when service encounters unexpected error", async () => {
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const prisma = {
        project: { findUnique: jest.fn().mockRejectedValue(new Error("Database connection lost")) },
        projectMembership: { findFirst: jest.fn().mockResolvedValue(null) },
        aiRequestLog: { count: jest.fn().mockResolvedValue(0), create: jest.fn() },
      };
      const service = new AiService(organizations as any, prisma as any);
      const result = await service.answer(7, 2, { prompt: "summary", projectId: 1 });
      expect(result.status).toBe("fallback");
      expect(result.answer).toContain("temporarily unavailable");
    });
  });
});