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
import { ProjectTemplatesService } from "./project-templates.service";
import { CreateProjectTemplateDto } from "./dto/create-project-template.dto";
import { UpdateProjectTemplateDto } from "./dto/update-project-template.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("project-templates")
@ApiBearerAuth()
@Controller("project-templates")
export class ProjectTemplatesController {
  constructor(
    private readonly projectTemplatesService: ProjectTemplatesService,
  ) {}

  @Post()
  async create(
    @Body() createProjectTemplateDto: CreateProjectTemplateDto,
    @CurrentUser() user: any,
  ) {
    const userId = user?.userId || user?.sub;
    return this.projectTemplatesService.create(createProjectTemplateDto, userId);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.projectTemplatesService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.projectTemplatesService.findOne(Number(id));
  }

  @Post(":id/create-project")
  async createProjectFromTemplate(
    @Param("id") id: string,
    @Body() overrides: any,
  ) {
    return this.projectTemplatesService.createProjectFromTemplate(
      Number(id),
      overrides,
    );
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateProjectTemplateDto: UpdateProjectTemplateDto,
  ) {
    return this.projectTemplatesService.update(
      Number(id),
      updateProjectTemplateDto,
    );
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.projectTemplatesService.remove(Number(id));
  }
}
