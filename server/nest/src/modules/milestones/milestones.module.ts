import { Module } from "@nestjs/common";
import { MilestonesController } from "./milestones.controller";
import { MilestonesService } from "./milestones.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [MilestonesController],
  providers: [MilestonesService, PrismaService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
