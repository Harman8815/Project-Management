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
      include: {
        memberships: {
          include: { user: { select: { userId: true, username: true } } },
        },
        settings: true,
        customFields: true,
        integrations: {
          select: { id: true, provider: true, name: true, enabled: true },
        },
      },
    });
    if (!organization) throw new NotFoundException("Organization not found");

    const { integrations, ...orgRest } = organization;
    const safeIntegrations = integrations.map((i) => ({
      id: i.id,
      provider: i.provider,
      name: i.name,
      enabled: i.enabled,
    }));
    return { ...orgRest, integrations: safeIntegrations };
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

  async findMembers(organizationId: number, userId: number) {
    await this.assertRole(userId, organizationId);
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      include: {
        user: { select: { userId: true, username: true } },
      },
    });
    return memberships.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      role: m.role,
    }));
  }

  async findIntegrations(organizationId: number, userId: number) {
    await this.assertRole(userId, organizationId);
    const integrations = await this.prisma.integration.findMany({
      where: { organizationId },
      select: { id: true, provider: true, name: true, enabled: true },
    });
    return integrations;
  }

  async removeMember(actorId: number, organizationId: number, userId: number) {
    await this.assertRole(actorId, organizationId, ["OWNER", "ADMIN"]);
    return this.prisma.organizationMembership.delete({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }
}
