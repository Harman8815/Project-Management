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
}
