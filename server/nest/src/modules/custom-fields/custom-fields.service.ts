import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationsService } from "../organizations/organizations.service";

const supportedTypes = ["TEXT", "NUMBER", "BOOLEAN", "DATE", "SELECT"];

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService, private readonly organizations: OrganizationsService) {}

  async create(userId: number, organizationId: number, data: { name: string; key: string; fieldType: string; options?: string; required?: boolean }) {
    await this.organizations.assertRole(userId, organizationId, ["OWNER", "ADMIN"]);
    if (!supportedTypes.includes(data.fieldType)) throw new BadRequestException("Unsupported custom field type");
    return this.prisma.customFieldDefinition.create({ data: { ...data, organizationId } });
  }

  async list(userId: number, organizationId: number) {
    await this.organizations.assertRole(userId, organizationId);
    return this.prisma.customFieldDefinition.findMany({ where: { organizationId } });
  }

  async setValue(userId: number, definitionId: number, target: { projectId?: number; taskId?: number; value: string }) {
    const definition = await this.prisma.customFieldDefinition.findUnique({ where: { id: definitionId } });
    if (!definition || (!target.projectId && !target.taskId)) throw new BadRequestException("A field definition and target are required");
    await this.organizations.assertRole(userId, definition.organizationId);
    if (definition.fieldType === "NUMBER" && Number.isNaN(Number(target.value))) throw new BadRequestException("Value must be numeric");
    if (definition.fieldType === "BOOLEAN" && !["true", "false"].includes(target.value)) throw new BadRequestException("Value must be boolean");
    const existing = await this.prisma.customFieldValue.findFirst({
      where: { definitionId, projectId: target.projectId, taskId: target.taskId },
    });
    if (existing) {
      return this.prisma.customFieldValue.update({ where: { id: existing.id }, data: { value: target.value } });
    }
    return this.prisma.customFieldValue.create({
      data: { definitionId, projectId: target.projectId, taskId: target.taskId, value: target.value },
    });
  }

  async values(userId: number, organizationId: number, query?: { projectId?: number; taskId?: number; key?: string }) {
    await this.organizations.assertRole(userId, organizationId);
    return this.prisma.customFieldValue.findMany({
      where: { projectId: query?.projectId, taskId: query?.taskId, definition: { organizationId, key: query?.key } },
      include: { definition: true },
    });
  }
}
