import { Module } from "@nestjs/common";
import { MethodologyController } from "./methodology.controller";
import { MethodologyService } from "./methodology.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsModule } from "../project-memberships/project-memberships.module";

@Module({
  imports: [ProjectMembershipsModule],
  controllers: [MethodologyController],
  providers: [MethodologyService, PrismaService],
  exports: [MethodologyService],
})
export class MethodologyModule {}