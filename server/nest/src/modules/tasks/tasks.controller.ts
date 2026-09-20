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

@ApiTags("tasks")
@ApiBearerAuth()
@Controller("tasks")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @ApiQuery({ name: "projectId", required: true })
  @Get()
  async findAll(@Query("projectId") projectId: number) {
    return this.tasksService.findAll(projectId);
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
  ) {
    return this.tasksService.updateStatus(Number(taskId), updateTaskStatusDto);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(Number(id), updateTaskDto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.tasksService.remove(Number(id));
  }
}
