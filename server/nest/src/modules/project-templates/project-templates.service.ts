import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectTemplateDto } from "./dto/create-project-template.dto";
import { UpdateProjectTemplateDto } from "./dto/update-project-template.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CreateProjectDto } from "../projects/dto/create-project.dto";

@Injectable()
export class ProjectTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectTemplateDto: CreateProjectTemplateDto, userId?: number) {
    const existingDefault = await this.prisma.projectTemplate.findFirst({
      where: { isDefault: true },
    });

    if (createProjectTemplateDto.isDefault && existingDefault) {
      await this.prisma.projectTemplate.update({
        where: { id: existingDefault.id },
        data: { isDefault: false },
      });
    }

    return this.prisma.projectTemplate.create({
      data: {
        name: createProjectTemplateDto.name,
        description: createProjectTemplateDto.description,
        isDefault: createProjectTemplateDto.isDefault ?? false,
        projectConfig: createProjectTemplateDto.projectConfig
          ? JSON.stringify(createProjectTemplateDto.projectConfig)
          : undefined,
        createdById: userId,
      },
    });
  }

  async findAll(query: PaginationDto) {
    const { skip, take } = getPaginationParams(query);
    const [data, total] = await Promise.all([
      this.prisma.projectTemplate.findMany({ skip, take }),
      this.prisma.projectTemplate.count(),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`ProjectTemplate with id ${id} not found`);
    }
    return template;
  }

  async findDefault() {
    const template = await this.prisma.projectTemplate.findFirst({
      where: { isDefault: true },
    });
    return template;
  }

  async createProjectFromTemplate(
    templateId: number,
    overrides: Partial<CreateProjectDto>,
  ) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException(`ProjectTemplate with id ${templateId} not found`);
    }

    const config = template.projectConfig ? JSON.parse(template.projectConfig) : {};

    return this.prisma.project.create({
      data: {
        name: overrides.name || `${template.name} Copy`,
        description: overrides.description ?? config.description ?? undefined,
        startDate: overrides.startDate ? new Date(overrides.startDate) : undefined,
        endDate: overrides.endDate ? new Date(overrides.endDate) : undefined,
        dueDate: overrides.dueDate ? new Date(overrides.dueDate) : undefined,
        status: overrides.status || config.status || "PLANNED",
        priority: overrides.priority || config.priority || "MEDIUM",
        health: config.health || "ON_TRACK",
        objectives: config.objectives || undefined,
      },
    });
  }

  async update(id: number, updateProjectTemplateDto: UpdateProjectTemplateDto) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`ProjectTemplate with id ${id} not found`);
    }
    return this.prisma.projectTemplate.update({
      where: { id },
      data: {
        name: updateProjectTemplateDto.name,
        description: updateProjectTemplateDto.description,
        isDefault: updateProjectTemplateDto.isDefault,
        projectConfig: updateProjectTemplateDto.projectConfig
          ? JSON.stringify(updateProjectTemplateDto.projectConfig)
          : undefined,
      },
    });
  }

  async remove(id: number) {
    const template = await this.prisma.projectTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException(`ProjectTemplate with id ${id} not found`);
    }
    return this.prisma.projectTemplate.delete({
      where: { id },
    });
  }
}