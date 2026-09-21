import { Module } from "@nestjs/common";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsModule } from "../project-memberships/project-memberships.module";

@Module({
  imports: [ProjectMembershipsModule],
  controllers: [ExportController],
  providers: [ExportService, PrismaService],
  exports: [ExportService],
})
export class ExportModule {}