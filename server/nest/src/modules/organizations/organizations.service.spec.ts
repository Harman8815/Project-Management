import { ForbiddenException } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

describe("OrganizationsService", () => {
  it("denies members without an allowed role", async () => {
    const prisma = { organizationMembership: { findUnique: jest.fn().mockResolvedValue({ userId: 4, organizationId: 2, role: "MEMBER" }) } };
    const service = new OrganizationsService(prisma as any);
    await expect(service.assertRole(4, 2, ["OWNER", "ADMIN"])).rejects.toThrow(ForbiddenException);
  });

  it("allows members with a matching role", async () => {
    const membership = { userId: 4, organizationId: 2, role: "ADMIN" };
    const prisma = { organizationMembership: { findUnique: jest.fn().mockResolvedValue(membership) } };
    const service = new OrganizationsService(prisma as any);
    await expect(service.assertRole(4, 2, ["OWNER", "ADMIN"])).resolves.toEqual(membership);
  });
});
