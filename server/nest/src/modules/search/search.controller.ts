import { Controller, Get, Query, Delete, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { SearchHistoryService } from "./search-history.service";

@ApiTags("search")
@ApiBearerAuth()
@Controller("search")
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly searchHistoryService: SearchHistoryService,
  ) {}

  @ApiQuery({ name: "query", required: true })
  @Get()
  async search(@Query("query") query: string, @Req() req: any) {
    const userId = req.user?.userId;
    return this.searchService.search(query, userId);
  }

  @ApiQuery({ name: "limit", required: false })
  @Get("recent")
  async getRecentSearches(@Req() req: any, @Query("limit") limit: number = 10) {
    const userId = req.user?.userId;
    if (!userId) return [];
    return this.searchHistoryService.getRecentSearches(userId, limit);
  }

  @ApiQuery({ name: "period", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get("top")
  async getTopSearches(@Query("period") period: "week" | "month" | "all" = "week", @Query("limit") limit: number = 10) {
    return this.searchHistoryService.getTopSearches(period, limit);
  }

  @Delete("recent")
  async clearRecentSearches(@Req() req: any) {
    const userId = req.user?.userId;
    if (!userId) return { success: true };
    await this.searchHistoryService.clearRecentSearches(userId);
    return { success: true };
  }
}
