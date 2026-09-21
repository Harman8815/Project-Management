import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, name: string, slug: string) {
    return this.prisma.organization.create({
      data: {
        name,
        slug,
        createdById: userId,
        memberships: { create: { userId, role: "OWNER" } },
      },
      include: { memberships: true },
    });
  }

  async addMember(actorId: number, organizationId: number, userId: number, role = "MEMBER") {
    await this.assertRole(actorId, organizationId, ["OWNER", "ADMIN"]);
    return this.prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId, userId } },
      update: { role },
      create: { organizationId, userId, role },
    });
  }

  async assertRole(userId: number, organizationId: number, roles: string[] = []) {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership || (roles.length > 0 && !roles.includes(membership.role))) {
      throw new ForbiddenException("Insufficient organization permissions");
    }
    return membership;
  }

  async get(id: number, userId: number) {
    await this.assertRole(userId, id);
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: { memberships: true, settings: true },
    });
    if (!organization) throw new NotFoundException("Organization not found");
    return organization;
  }

  async updateSettings(userId: number, organizationId: number, settings: Record<string, string>) {
    await this.assertRole(userId, organizationId, ["OWNER", "ADMIN"]);
    return Promise.all(Object.entries(settings).map(([key, value]) =>
      this.prisma.organizationSetting.upsert({
        where: { organizationId_key: { organizationId, key } },
        update: { value },
        create: { organizationId, key, value },
      }),
    ));
  }

  async removeMember(actorId: number, organizationId: number, userId: number) {
    await this.assertRole(actorId, organizationId, ["OWNER", "ADMIN"]);
    return this.prisma.organizationMembership.delete({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }
}
