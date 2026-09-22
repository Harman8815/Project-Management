import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, actorId?: number) {
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data: {
          key: createProjectDto.key,
          name: createProjectDto.name,
          description: createProjectDto.description,
          startDate: createProjectDto.startDate,
          endDate: createProjectDto.endDate,
          dueDate: createProjectDto.dueDate,
          status: createProjectDto.status,
          priority: createProjectDto.priority,
          health: createProjectDto.health,
          objectives: createProjectDto.objectives,
        },
        include: {
          members: true,
        },
      });

      // Add creator as project owner
      if (actorId) {
        await prisma.projectMembership.create({
          data: {
            userId: actorId,
            projectId: project.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        });

        await prisma.activityLog.create({
          data: {
            eventType: "PROJECT_CREATED",
            message: `Project "${project.name}" created`,
            projectId: project.id,
            actorId,
          },
        });
      } else {
        await prisma.activityLog.create({
          data: {
            eventType: "PROJECT_CREATED",
            message: `Project "${project.name}" created`,
            projectId: project.id,
          },
        });
      }

      return project;
    });
  }

  async findAll(query: PaginationDto, userId?: number) {
    const { skip, take } = getPaginationParams(query);
    
    const whereClause: any = {};
    if (userId) {
      const userMemberships = await this.prisma.projectMembership.findMany({
        where: { userId, status: "ACTIVE" },
        select: { projectId: true },
      });
      whereClause.id = { in: userMemberships.map(m => m.projectId) };
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          tasks: true,
          projectTeams: true,
        },
      }),
      this.prisma.project.count({ where: whereClause }),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: { include: { author: true, assignee: true } },
        projectTeams: true,
      },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, actorId?: number) {
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findUnique({
        where: { id },
      });
      if (!project) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }
      if (updateProjectDto.status && updateProjectDto.status !== project.status) {
        const transitions: Record<string, string[]> = {
          PLANNED: ["ACTIVE", "ON_HOLD", "ARCHIVED"],
          ACTIVE: ["ON_HOLD", "COMPLETED", "ARCHIVED"],
          ON_HOLD: ["ACTIVE", "ARCHIVED"],
          COMPLETED: ["ARCHIVED"],
          ARCHIVED: ["ACTIVE"],
        };
        if (!transitions[project.status]?.includes(updateProjectDto.status)) {
          throw new BadRequestException(`Invalid project status transition: ${project.status} -> ${updateProjectDto.status}`);
        }
      }
      
      const updatedProject = await prisma.project.update({
        where: { id },
        data: updateProjectDto,
      });

      if (actorId) {
        await prisma.activityLog.create({
          data: {
            eventType: "PROJECT_UPDATED",
            message: `Project "${project.name}" updated`,
            projectId: project.id,
            actorId,
          },
        });
      }

      return updatedProject;
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findUnique({
        where: { id },
      });
      if (!project) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }
      return prisma.project.delete({
        where: { id },
      });
    });
  }

  async archive(id: number, actorId?: number) {
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findUnique({
        where: { id },
      });
      if (!project) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }
      
      await prisma.activityLog.create({
        data: {
          eventType: "PROJECT_ARCHIVED",
          message: `Project "${project.name}" archived`,
          projectId: project.id,
          actorId,
        },
      });
      
      return prisma.project.update({
        where: { id },
        data: { archived: true, status: "ARCHIVED" },
      });
    });
  }

  async restore(id: number, actorId?: number) {
    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.findUnique({
        where: { id, archived: true },
      });
      if (!project) {
        throw new NotFoundException(
          `Archived project with id ${id} not found`,
        );
      }
      
      await prisma.activityLog.create({
        data: {
          eventType: "PROJECT_RESTORED",
          message: `Project "${project.name}" restored`,
          projectId: project.id,
          actorId,
        },
      });
      
      return prisma.project.update({
        where: { id },
        data: { archived: false, status: "ACTIVE" },
      });
    });
  }
}
