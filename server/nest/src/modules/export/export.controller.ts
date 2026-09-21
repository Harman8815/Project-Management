import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ExportService } from "./export.service";
import { ExportQueryDto } from "./dto/export-query.dto";

@ApiTags("export")
@ApiBearerAuth()
@Controller("export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @ApiConsumes("application/json")
  @Post()
  async exportData(
    @Body() query: ExportQueryDto,
    @CurrentUser() user: any,
  ) {
    return this.exportService.exportData(query, user?.userId);
  }
}