import { BadRequestException, Injectable } from "@nestjs/common";
import { OrganizationsService } from "../organizations/organizations.service";

export type AiRequest = { projectId?: number; prompt: string; confirmMutation?: boolean };

@Injectable()
export class AiService {
  constructor(private readonly organizations: OrganizationsService) {}

  async answer(userId: number, organizationId: number, request: AiRequest) {
    await this.organizations.assertRole(userId, organizationId);
    if (!request.prompt || request.prompt.length > 4000) throw new BadRequestException("Prompt must be between 1 and 4000 characters");
    if (request.confirmMutation) throw new BadRequestException("AI mutations require an explicit action endpoint");
    return { status: "accepted", answer: "AI provider integration is not configured", sources: [], projectId: request.projectId };
  }
}
