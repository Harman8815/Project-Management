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
  ForbiddenException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { FilterSortDto } from "../../common/dto/filter-sort.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("tasks")
@ApiBearerAuth()
@Controller("tasks")
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.create(createTaskDto, user?.userId);
  }

  @ApiQuery({ name: "projectId", required: true })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "priority", required: false })
  @ApiQuery({ name: "search", required: false })
  @Get()
  async findAll(
    @Query("projectId") projectId: number,
    @Query() filterDto: FilterSortDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.findAll(projectId, filterDto, user?.userId);
  }

  @Get("user/:userId")
  async findByUser(@Param("userId") userId: number, @CurrentUser() user: any) {
    // Users can only see their own tasks
    if (user?.userId !== userId) {
      throw new ForbiddenException("You can only view your own tasks");
    }
    return this.tasksService.findByUser(userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.tasksService.findOne(Number(id), user?.userId);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") taskId: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.updateStatus(Number(taskId), updateTaskStatusDto, user?.userId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(Number(id), updateTaskDto, user?.userId);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.tasksService.remove(Number(id), user?.userId);
  }

  @Post(":id/dependencies")
  async addDependency(
    @Param("id") taskId: string,
    @Body("blockedById") blockedById: number,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.addDependency(Number(taskId), blockedById, user?.userId);
  }

  @Delete(":id/dependencies/:blockedById")
  async removeDependency(
    @Param("id") taskId: string,
    @Param("blockedById") blockedById: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.removeDependency(Number(taskId), Number(blockedById), user?.userId);
  }

  @Get(":id/dependencies")
  async getDependencies(@Param("id") taskId: string, @CurrentUser() user: any) {
    return this.tasksService.getDependencies(Number(taskId), user?.userId);
  }

  @Get("workflow/transitions")
  async getValidTransitions(
    @Query("status") status: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.tasksService.getValidTransitions(status, projectId);
  }

  @Get("workflow/statuses")
  async getWorkflowStatuses(@Query("projectId") projectId?: string) {
    if (projectId) {
      return this.tasksService.getWorkflowForProject(Number(projectId));
    }
    return this.tasksService.getDefaultWorkflow();
  }

  @Get(":id/children")
  async getChildren(@Param("id") parentId: string, @CurrentUser() user: any) {
    return this.tasksService.getChildren(Number(parentId), user?.userId);
  }

  @Post(":id/watchers")
  async addWatcher(
    @Param("id") taskId: string,
    @Body("userId") userId: number,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.addWatcher(Number(taskId), userId, user?.userId);
  }

  @Delete(":id/watchers/:userId")
  async removeWatcher(
    @Param("id") taskId: string,
    @Param("userId") userId: string,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.removeWatcher(Number(taskId), Number(userId), user?.userId);
  }

  @Get(":id/watchers")
  async getWatchers(@Param("id") taskId: string, @CurrentUser() user: any) {
    return this.tasksService.getWatchers(Number(taskId), user?.userId);
  }
}
