import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SearchService } from "./search.service";

@ApiTags("search")
@ApiBearerAuth()
@Controller("search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiQuery({ name: "query", required: true })
  @Get()
  async search(@Query("query") query: string) {
    return this.searchService.search(query);
  }
}
