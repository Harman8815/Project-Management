import { Module } from "@nestjs/common";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsModule } from "../project-memberships/project-memberships.module";

@Module({
  imports: [ProjectMembershipsModule],
  controllers: [ResourcesController],
  providers: [ResourcesService, PrismaService],
  exports: [ResourcesService],
})
export class ResourcesModule {}