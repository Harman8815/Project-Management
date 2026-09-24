import { Module } from "@nestjs/common";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { OrganizationsModule } from "../organizations/organizations.module";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  imports: [OrganizationsModule],
  controllers: [CalendarController],
  providers: [CalendarService, PrismaService],
  exports: [CalendarService],
})
export class CalendarModule {}