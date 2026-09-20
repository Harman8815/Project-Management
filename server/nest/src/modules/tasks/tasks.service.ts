import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { FilterSortDto } from "../../common/dto/filter-sort.dto";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status,
        priority: createTaskDto.priority,
        tags: createTaskDto.tags,
        startDate: createTaskDto.startDate,
        dueDate: createTaskDto.dueDate,
        points: createTaskDto.points,
        projectId: createTaskDto.projectId,
        authorUserId: createTaskDto.authorUserId,
        assignedUserId: createTaskDto.assignedUserId,
      },
      include: {
        author: true,
        assignee: true,
      },
    });
  }

  async findAll(projectId: number, filterDto?: FilterSortDto) {
    const where: any = { projectId };

    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    if (filterDto?.priority) {
      where.priority = filterDto.priority;
    }

    if (filterDto?.search) {
      where.OR = [
        { title: { contains: filterDto.search } },
        { description: { contains: filterDto.search } },
      ];
    }

    const orderBy: any = {};
    if (filterDto?.sortBy) {
      orderBy[filterDto.sortBy] = filterDto.sortOrder || "asc";
    }

    return this.prisma.task.findMany({
      where,
      orderBy,
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
  }

  async findByUser(userId: number) {
    return this.prisma.task.findMany({
      where: {
        OR: [
          { authorUserId: userId },
          { assignedUserId: userId },
        ],
      },
      include: {
        author: true,
        assignee: true,
      },
    });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async updateStatus(id: number, updateTaskStatusDto: UpdateTaskStatusDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return this.prisma.task.update({
      where: { id },
      data: { status: updateTaskStatusDto.status },
      include: {
        author: true,
        assignee: true,
      },
    });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async remove(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
