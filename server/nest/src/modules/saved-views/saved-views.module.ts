import { Module } from "@nestjs/common";
import { SavedViewsController } from "./saved-views.controller";
import { SavedViewsService } from "./saved-views.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [SavedViewsController],
  providers: [SavedViewsService, PrismaService],
  exports: [SavedViewsService],
})
export class SavedViewsModule {}