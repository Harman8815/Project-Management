import { PartialType } from "@nestjs/swagger";
import { CreateProjectMembershipDto } from "./create-project-membership.dto";

export class UpdateProjectMembershipDto extends PartialType(
  CreateProjectMembershipDto,
) {}
