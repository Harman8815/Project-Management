import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationEngineService } from "./notification-engine.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationEngineService, PrismaService],
  exports: [NotificationsService, NotificationEngineService],
})
export class NotificationsModule {}
