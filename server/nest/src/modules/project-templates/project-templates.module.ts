import { Module } from "@nestjs/common";
import { ProjectTemplatesController } from "./project-templates.controller";
import { ProjectTemplatesService } from "./project-templates.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService, PrismaService],
  exports: [ProjectTemplatesService],
})
export class ProjectTemplatesModule {}
