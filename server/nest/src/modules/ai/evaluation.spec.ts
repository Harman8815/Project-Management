import { ForbiddenException } from "@nestjs/common";
import { AiService } from "./ai.service";
import { aiEvaluationCases } from "./evaluation.dataset";

describe("AI evaluation cases", () => {
  it.each(aiEvaluationCases)("keeps $name factual", async ({ prompt, expectedText }) => {
    const service = new AiService(
      { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) } as any,
      {
        aiRequestLog: { count: jest.fn().mockResolvedValue(0), create: jest.fn().mockResolvedValue({ id: 1 }) },
        project: { findUnique: jest.fn().mockResolvedValue({ id: 1, organizationId: 2, name: "Alpha", tasks: [{ status: "Done", dueDate: new Date(Date.now() - 86400000) }], milestones: [], sprints: [] }) },
        projectMembership: { findFirst: jest.fn().mockResolvedValue({ userId: 7, projectId: 1, status: "ACTIVE" }) },
      } as any,
    );
    const result = await service.answer(7, 2, { projectId: 1, prompt });
    expect(result.answer.toLowerCase()).toContain(expectedText);
  });

  it("rejects project reports outside the member's project scope", async () => {
    const service = new AiService(
      { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) } as any,
      {
        project: { findUnique: jest.fn().mockResolvedValue({ organizationId: 2 }) },
        projectMembership: { findFirst: jest.fn().mockResolvedValue(null) },
      } as any,
    );
    await expect(service.generateReport(7, 2, 99, "status")).rejects.toThrow(ForbiddenException);
  });
});
