import { Module } from "@nestjs/common";
import { BulkImportController } from "./bulk-import.controller";
import { BulkImportService } from "./bulk-import.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [BulkImportController],
  providers: [BulkImportService, PrismaService],
  exports: [BulkImportService],
})
export class BulkImportModule {}