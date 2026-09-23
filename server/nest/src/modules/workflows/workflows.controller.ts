import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { WorkflowsService } from "./workflows.service";
import { CreateWorkflowDto, UpdateWorkflowDto } from "./dto/create-workflow.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("workflows")
@ApiBearerAuth()
@Controller("organizations/:organizationId/workflows")
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  async create(
    @Param("organizationId") organizationId: string,
    @Body() createWorkflowDto: CreateWorkflowDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.create(
      { ...createWorkflowDto, organizationId: Number(organizationId) },
      user?.userId,
    );
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "type", required: false })
  @Get()
  async findAll(
    @Param("organizationId") organizationId: string,
    @Query() query: PaginationDto & { type?: string },
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.findAll(
      { ...query, organizationId: Number(organizationId) },
      user?.userId,
    );
  }

  @Get(":type")
  async findOne(
    @Param("organizationId") organizationId: string,
    @Param("type") type: string,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.findOne(Number(organizationId), type, user?.userId);
  }

  @Patch(":type")
  async update(
    @Param("organizationId") organizationId: string,
    @Param("type") type: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.update(
      Number(organizationId),
      type,
      updateWorkflowDto,
      user?.userId,
    );
  }

  @Delete(":type")
  async remove(
    @Param("organizationId") organizationId: string,
    @Param("type") type: string,
    @CurrentUser() user: any,
  ) {
    return this.workflowsService.remove(Number(organizationId), type, user?.userId);
  }

  @Post(":type/validate-transition")
  async validateTransition(
    @Param("organizationId") organizationId: string,
    @Param("type") type: string,
    @Body() body: { currentState: string; newState: string },
  ) {
    return this.workflowsService.validateTransition(
      Number(organizationId),
      type,
      body.currentState,
      body.newState,
    );
  }

  @Post(":type/execute-transition")
  async executeTransitionActions(
    @Param("organizationId") organizationId: string,
    @Param("type") type: string,
    @Body() body: { transition: string; context: any },
  ) {
    return this.workflowsService.executeTransitionActions(
      Number(organizationId),
      type,
      body.transition,
      body.context,
    );
  }
}
