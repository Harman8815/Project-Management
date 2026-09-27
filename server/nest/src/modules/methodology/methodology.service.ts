import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectMembershipsService } from "../project-memberships/project-memberships.service";

export type MethodologyKey = "KANBAN" | "WATERFALL" | "SCRUM";

export interface MethodologyConfig {
  id: number;
  name: string;
  key: MethodologyKey;
  config: {
    workflowStates?: string[];
    phases?: string[];
    showBoard?: boolean;
    showSprints?: boolean;
    showMilestones?: boolean;
    showGantt?: boolean;
    requiredFields?: string[];
  };
  isDefault: boolean;
}

@Injectable()
export class MethodologyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectMembershipsService: ProjectMembershipsService,
  ) {}

  async getAllMethodologies(): Promise<MethodologyConfig[]> {
    const configs = await this.prisma.methodologyConfig.findMany({
      orderBy: { isDefault: "desc" },
    });
    return configs.map((c) => ({
      ...c,
      config: JSON.parse(c.config),
      key: c.key as MethodologyKey,
    }));
  }

  async getMethodology(key: MethodologyKey): Promise<MethodologyConfig | null> {
    const config = await this.prisma.methodologyConfig.findUnique({
      where: { key },
    });
    if (!config) return null;
    return {
      ...config,
      config: JSON.parse(config.config),
      key: config.key as MethodologyKey,
    };
  }

  async getDefaultMethodology(): Promise<MethodologyConfig | null> {
    const config = await this.prisma.methodologyConfig.findFirst({
      where: { isDefault: true },
    });
    if (!config) return null;
    return {
      ...config,
      config: JSON.parse(config.config),
      key: config.key as MethodologyKey,
    };
  }

  async getProjectMethodology(projectId: number, userId: number): Promise<MethodologyConfig> {
    const hasAccess = await this.projectMembershipsService.checkUserAccess(userId, projectId);
    if (!hasAccess) {
      throw new ForbiddenException("You do not have access to this project");
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { methodology: true },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    const config = await this.getMethodology(project.methodology as MethodologyKey);
    if (!config) {
      const defaultConfig = await this.getDefaultMethodology();
      if (!defaultConfig) {
        throw new NotFoundException("No default methodology configured");
      }
      return defaultConfig;
    }
    return config;
  }

  async setProjectMethodology(
    projectId: number,
    userId: number,
    methodologyKey: MethodologyKey,
  ) {
    const canManage = await this.projectMembershipsService.checkUserAccess(
      userId,
      projectId,
      ["OWNER", "ADMIN"],
    );
    if (!canManage) {
      throw new ForbiddenException("You do not have permission to change project methodology");
    }

    const methodology = await this.getMethodology(methodologyKey);
    if (!methodology) {
      throw new BadRequestException(`Unknown methodology: ${methodologyKey}`);
    }

    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { methodology: methodologyKey },
    });

    // Create activity log
    await this.prisma.activityLog.create({
      data: {
        eventType: "METHODOLOGY_CHANGED",
        actorId: userId,
        projectId,
        message: `Project methodology changed to ${methodology.name}`,
        metadata: JSON.stringify({ methodologyKey }),
      },
    });

    return project;
  }

  async createMethodologyConfig(data: {
    name: string;
    key: MethodologyKey;
    config: {
      workflowStates?: string[];
      phases?: string[];
      showBoard?: boolean;
      showSprints?: boolean;
      showMilestones?: boolean;
      showGantt?: boolean;
      requiredFields?: string[];
    };
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.methodologyConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.methodologyConfig.create({
      data: {
        name: data.name,
        key: data.key,
        config: JSON.stringify(data.config),
        isDefault: data.isDefault || false,
      },
    });
  }

  async updateMethodologyConfig(
    key: MethodologyKey,
    data: {
      name?: string;
      config?: any;
      isDefault?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.methodologyConfig.updateMany({
        where: { isDefault: true, key: { not: key } },
        data: { isDefault: false },
      });
    }

    return this.prisma.methodologyConfig.update({
      where: { key },
      data: {
        name: data.name,
        config: data.config ? JSON.stringify(data.config) : undefined,
        isDefault: data.isDefault,
      },
    });
  }

  async deleteMethodologyConfig(key: MethodologyKey) {
    const config = await this.prisma.methodologyConfig.findUnique({
      where: { key },
    });
    if (!config) {
      throw new NotFoundException(`Methodology ${key} not found`);
    }
    if (config.isDefault) {
      throw new Error("Cannot delete default methodology");
    }

    // Check if any projects use this methodology
    const projectsUsing = await this.prisma.project.count({
      where: { methodology: key },
    });
    if (projectsUsing > 0) {
      throw new Error(`Cannot delete methodology used by ${projectsUsing} projects`);
    }

    return this.prisma.methodologyConfig.delete({
      where: { key },
    });
  }
}