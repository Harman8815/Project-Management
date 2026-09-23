import { ForbiddenException, UnauthorizedException, BadRequestException, NotFoundException } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service";

describe("IntegrationsService Security & Permissions", () => {
  const makeService = (prisma: any, organizations: any) => new IntegrationsService(prisma as any, organizations as any);

  describe("create integration - role enforcement", () => {
    it("allows OWNER to create integration", async () => {
      const prisma = {
        integration: { create: jest.fn().mockResolvedValue({ id: 1, organizationId: 2 }) },
        project: { findFirst: jest.fn() },
      };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "OWNER" }) };
      const service = makeService(prisma, organizations);
      await service.create(1, 2, { provider: "github", name: "GitHub" });
      expect(organizations.assertRole).toHaveBeenCalledWith(1, 2, ["OWNER", "ADMIN"]);
    });

    it("allows ADMIN to create integration", async () => {
      const prisma = {
        integration: { create: jest.fn().mockResolvedValue({ id: 1, organizationId: 2 }) },
        project: { findFirst: jest.fn() },
      };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "ADMIN" }) };
      const service = makeService(prisma, organizations);
      await service.create(1, 2, { provider: "gitlab", name: "GitLab" });
      expect(organizations.assertRole).toHaveBeenCalledWith(1, 2, ["OWNER", "ADMIN"]);
    });

    it("rejects MEMBER from creating integration", async () => {
      const prisma = { project: { findFirst: jest.fn() } };
      const organizations = { assertRole: jest.fn().mockRejectedValue(new ForbiddenException("Insufficient org permissions")) };
      const service = makeService(prisma, organizations);
      await expect(service.create(1, 2, { provider: "github", name: "GitHub" })).rejects.toThrow(ForbiddenException);
    });
  });

  describe("setCredentialRef - validation", () => {
    it("rejects invalid credential ref characters", async () => {
      const prisma = {
        integration: { findFirst: jest.fn().mockResolvedValue({ id: 1, organizationId: 2 }), update: jest.fn().mockResolvedValue({ secretRef: "test" }) },
      };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "ADMIN" }) };
      const service = makeService(prisma, organizations);
      await expect(service.setCredentialRef(1, 2, 1, "bad/ref")).rejects.toThrow(BadRequestException);
    });

    it("rejects credential ref for non-existent integration", async () => {
      const prisma = { integration: { findFirst: jest.fn().mockResolvedValue(null) } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "ADMIN" }) };
      const service = makeService(prisma, organizations);
      await expect(service.setCredentialRef(1, 2, 999, "github-token")).rejects.toThrow(NotFoundException);
    });
  });

  describe("export/import project - authorization", () => {
    it("rejects export for project outside organization", async () => {
      const prisma = { project: { findFirst: jest.fn().mockResolvedValue(null) } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.exportProject(1, 2, 99)).rejects.toThrow(ForbiddenException);
    });

    it("requires OWNER/ADMIN for import", async () => {
      const prisma = { project: { findFirst: jest.fn() } };
      const organizations = { assertRole: jest.fn().mockRejectedValue(new ForbiddenException("Insufficient org permissions")) };
      const service = makeService(prisma, organizations);
      await expect(service.importProject(1, 2, { project: { name: "Test" } })).rejects.toThrow(ForbiddenException);
    });
  });

  describe("providerActivity - GitHub/GitLab only", () => {
    it("rejects non-GitHub/GitLab providers", async () => {
      const prisma = { integration: { findFirst: jest.fn().mockResolvedValue({ id: 1, organizationId: 2, provider: "slack" }) } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.providerActivity(1, 2, 1)).rejects.toThrow(BadRequestException);
    });

    it("rejects when credential not configured", async () => {
      const prisma = { integration: { findFirst: jest.fn().mockResolvedValue({ id: 1, organizationId: 2, provider: "github", secretRef: null }) } };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.providerActivity(1, 2, 1)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("linkActivityToTask - project access check", () => {
    it("rejects linking activity to task outside project", async () => {
      const prisma = {
        task: { findUnique: jest.fn().mockResolvedValue({ project: { organizationId: 99 } }) },
        projectMembership: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const organizations = { assertRole: jest.fn().mockResolvedValue({ role: "MEMBER" }) };
      const service = makeService(prisma, organizations);
      await expect(service.linkActivityToTask(1, 2, 1, { type: "commit", title: "abc" })).rejects.toThrow(ForbiddenException);
    });
  });

  describe("webhook verification security", () => {
    it("rejects tampered payloads", () => {
      const service = makeService({} as any, {} as any);
      expect(() => service.verifyWebhook("original", "wrong-signature", "secret")).toThrow(UnauthorizedException);
    });
  });

  describe("retryEvent - event ownership", () => {
    it("rejects retry for non-existent event", async () => {
      const prisma = { integrationEvent: { findUnique: jest.fn().mockResolvedValue(null) } };
      const organizations = { assertRole: jest.fn() } as any;
      const service = makeService(prisma, organizations);
      await expect(service.retryEvent(999, "error")).rejects.toThrow(UnauthorizedException);
    });
  });
});