import { Module } from "@nestjs/common";
import { SprintsController } from "./sprints.controller";
import { SprintsService } from "./sprints.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [SprintsController],
  providers: [SprintsService, PrismaService],
  exports: [SprintsService],
})
export class SprintsModule {}
