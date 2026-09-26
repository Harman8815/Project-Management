import { Module } from "@nestjs/common";
import { ActivityLogController } from "./activity-log.controller";
import { ActivityLogService } from "./activity-log.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [NotificationsModule],
  controllers: [ActivityLogController],
  providers: [ActivityLogService, PrismaService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
