import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { SearchHistoryService } from "./search-history.service";
import { PrismaService } from "../../prisma/prisma.service";

@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchHistoryService, PrismaService],
  exports: [SearchHistoryService],
})
export class SearchModule {}
