import { Injectable, UnauthorizedException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { OrganizationsService } from "../organizations/organizations.service";

@Injectable()
export class IntegrationsService {
  constructor(private readonly prisma: PrismaService, private readonly organizations: OrganizationsService) {}

  async create(userId: number, organizationId: number, data: { provider: string; name: string; config?: Record<string, unknown>; secretRef?: string }) {
    await this.organizations.assertRole(userId, organizationId, ["OWNER", "ADMIN"]);
    return this.prisma.integration.create({ data: { organizationId, provider: data.provider, name: data.name, config: JSON.stringify(data.config || {}), secretRef: data.secretRef } });
  }

  verifyWebhook(payload: string, signature: string, secret: string) {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) throw new UnauthorizedException("Invalid webhook signature");
    return true;
  }
}
