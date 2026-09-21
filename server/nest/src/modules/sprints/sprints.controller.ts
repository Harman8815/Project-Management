import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { SprintsService } from "./sprints.service";
import { CreateSprintDto, UpdateSprintDto } from "./dto/create-sprint.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("sprints")
@ApiBearerAuth()
@Controller("sprints")
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

  @Post()
  async create(@Body() createSprintDto: CreateSprintDto) {
    return this.sprintsService.create(createSprintDto);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "projectId", required: false })
  @Get()
  async findAll(
    @Query() query: PaginationDto & { projectId?: number },
  ) {
    return this.sprintsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.sprintsService.findOne(Number(id));
  }

  @Get(":id/burndown")
  async getBurndown(@Param("id") id: string) {
    return this.sprintsService.getBurndown(Number(id));
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateSprintDto: UpdateSprintDto,
  ) {
    return this.sprintsService.update(Number(id), updateSprintDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.sprintsService.remove(Number(id));
  }
}
