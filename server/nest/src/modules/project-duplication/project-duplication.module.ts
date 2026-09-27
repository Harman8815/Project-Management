import { Module } from "@nestjs/common";
import { ProjectDuplicationController } from "./project-duplication.controller";
import { ProjectDuplicationService } from "./project-duplication.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsModule } from "../project-memberships/project-memberships.module";

@Module({
  imports: [ProjectMembershipsModule],
  controllers: [ProjectDuplicationController],
  providers: [ProjectDuplicationService, PrismaService],
  exports: [ProjectDuplicationService],
})
export class ProjectDuplicationModule {}