import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateMilestoneDto, UpdateMilestoneDto } from "./dto/create-milestone.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMilestoneDto: CreateMilestoneDto) {
    await this.ensureProjectExists(createMilestoneDto.projectId);
    return this.prisma.milestone.create({
      data: {
        name: createMilestoneDto.name,
        description: createMilestoneDto.description,
        projectId: createMilestoneDto.projectId,
        startDate: createMilestoneDto.startDate,
        dueDate: createMilestoneDto.dueDate,
        status: createMilestoneDto.status || "PLANNED",
        ownerId: createMilestoneDto.ownerId,
      },
      include: {
        project: true,
        owner: true,
      },
    });
  }

  async findAll(query: PaginationDto & { projectId?: number }) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.projectId) {
      where.projectId = Number(query.projectId);
    }

    const [data, total] = await Promise.all([
      this.prisma.milestone.findMany({
        where,
        skip,
        take,
        include: {
          project: true,
          owner: true,
        },
      }),
      this.prisma.milestone.count({ where }),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        project: true,
        owner: true,
      },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }
    return milestone;
  }

  async getCompletion(id: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }

    const totalTasks = milestone.tasks.length;
    const completedTasks = milestone.tasks.filter(
      (t) => t.status === "Completed" || t.status === "Done",
    ).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      milestoneId: id,
      milestoneName: milestone.name,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate),
    };
  }

  async update(id: number, updateMilestoneDto: UpdateMilestoneDto) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }
    return this.prisma.milestone.update({
      where: { id },
      data: {
        name: updateMilestoneDto.name,
        description: updateMilestoneDto.description,
        startDate: updateMilestoneDto.startDate,
        dueDate: updateMilestoneDto.dueDate,
        status: updateMilestoneDto.status,
        ownerId: updateMilestoneDto.ownerId,
      },
      include: {
        project: true,
        owner: true,
      },
    });
  }

  async remove(id: number) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
    });
    if (!milestone) {
      throw new NotFoundException(`Milestone with id ${id} not found`);
    }
    return this.prisma.milestone.delete({
      where: { id },
    });
  }

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
  }
}
