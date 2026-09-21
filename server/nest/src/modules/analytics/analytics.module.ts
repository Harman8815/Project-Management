import { Module } from "@nestjs/common";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsModule } from "../project-memberships/project-memberships.module";

@Module({
  imports: [ProjectMembershipsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
