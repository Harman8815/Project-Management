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
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { FilterSortDto } from "../../common/dto/filter-sort.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("tasks")
@ApiBearerAuth()
@Controller("tasks")
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
  ) {
    return this.tasksService.findAll(projectId, filterDto);
  }

  @Get("user/:userId")
  async findByUser(@Param("userId") userId: number) {
    return this.tasksService.findByUser(userId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.tasksService.findOne(Number(id));
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
  async remove(@Param("id") id: string) {
    return this.tasksService.remove(Number(id));
  }

  @Post(":id/dependencies")
  async addDependency(
    @Param("id") taskId: string,
    @Body("blockedById") blockedById: number,
  ) {
    return this.tasksService.addDependency(Number(taskId), blockedById);
  }

  @Delete(":id/dependencies/:blockedById")
  async removeDependency(
    @Param("id") taskId: string,
    @Param("blockedById") blockedById: string,
  ) {
    return this.tasksService.removeDependency(Number(taskId), Number(blockedById));
  }

  @Get(":id/dependencies")
  async getDependencies(@Param("id") taskId: string) {
    return this.tasksService.getDependencies(Number(taskId));
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
  async getChildren(@Param("id") parentId: string) {
    return this.tasksService.getChildren(Number(parentId));
  }

  @Post(":id/watchers")
  async addWatcher(
    @Param("id") taskId: string,
    @Body("userId") userId: number,
  ) {
    return this.tasksService.addWatcher(Number(taskId), userId);
  }

  @Delete(":id/watchers/:userId")
  async removeWatcher(
    @Param("id") taskId: string,
    @Param("userId") userId: string,
  ) {
    return this.tasksService.removeWatcher(Number(taskId), Number(userId));
  }

  @Get(":id/watchers")
  async getWatchers(@Param("id") taskId: string) {
    return this.tasksService.getWatchers(Number(taskId));
  }
}
