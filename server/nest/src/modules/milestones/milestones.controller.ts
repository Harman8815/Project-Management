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
import { MilestonesService } from "./milestones.service";
import { CreateMilestoneDto, UpdateMilestoneDto } from "./dto/create-milestone.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("milestones")
@ApiBearerAuth()
@Controller("milestones")
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Post()
  async create(@Body() createMilestoneDto: CreateMilestoneDto) {
    return this.milestonesService.create(createMilestoneDto);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "projectId", required: false })
  @Get()
  async findAll(
    @Query() query: PaginationDto & { projectId?: number },
  ) {
    return this.milestonesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.milestonesService.findOne(Number(id));
  }

  @Get(":id/completion")
  async getCompletion(@Param("id") id: string) {
    return this.milestonesService.getCompletion(Number(id));
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateMilestoneDto: UpdateMilestoneDto,
  ) {
    return this.milestonesService.update(Number(id), updateMilestoneDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.milestonesService.remove(Number(id));
  }
}
