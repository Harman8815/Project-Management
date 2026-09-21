import { Module } from "@nestjs/common";
import { ProjectMembershipsController } from "./project-memberships.controller";
import { ProjectMembershipsService } from "./project-memberships.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [ProjectMembershipsController],
  providers: [ProjectMembershipsService, PrismaService],
  exports: [ProjectMembershipsService],
})
export class ProjectMembershipsModule {}
