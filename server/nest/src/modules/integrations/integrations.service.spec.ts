import { UnauthorizedException } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";

describe("IntegrationsService", () => {
  it("verifies valid webhook signatures and rejects invalid ones", () => {
    const service = new IntegrationsService({} as any, {} as any);
    const payload = "event-payload";
    const signature = require("crypto").createHmac("sha256", "secret").update(payload).digest("hex");
    expect(service.verifyWebhook(payload, signature, "secret")).toBe(true);
    expect(() => service.verifyWebhook(payload, "bad", "secret")).toThrow(UnauthorizedException);
  });

  it("moves an event to failed after five attempts", async () => {
    const prisma = { integrationEvent: { findUnique: jest.fn().mockResolvedValue({ id: 3, attempts: 4 }), update: jest.fn().mockResolvedValue({ status: "FAILED" }) } };
    const service = new IntegrationsService(prisma as any, {} as any);
    await expect(service.retryEvent(3, "provider unavailable")).resolves.toEqual({ status: "FAILED" });
    expect(prisma.integrationEvent.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ attempts: 5, status: "FAILED" }) }));
  });

  it("stores only a credential reference and exports organization projects", async () => {
    const prisma = {
      integration: {
        findFirst: jest.fn().mockResolvedValue({ id: 4, organizationId: 2 }),
        update: jest.fn().mockResolvedValue({ id: 4, secretRef: "github-token" }),
      },
      project: {
        findFirst: jest.fn().mockResolvedValue({ id: 8, name: "Alpha", tasks: [], milestones: [], sprints: [] }),
      },
    };
    const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "ADMIN" }) };
    const service = new IntegrationsService(prisma as any, organizations as any);
    await expect(service.setCredentialRef(1, 2, 4, "github-token")).resolves.toMatchObject({ secretRef: "github-token" });
    await expect(service.exportProject(1, 2, 8)).resolves.toMatchObject({ project: { id: 8 } });
    expect(prisma.integration.update).toHaveBeenCalledWith({ where: { id: 4 }, data: { secretRef: "github-token" } });
  });
});
