import { Module } from "@nestjs/common";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsModule } from "../project-memberships/project-memberships.module";

@Module({
  imports: [ProjectMembershipsModule],
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService],
  exports: [ReportsService],
})
export class ReportsModule {}
