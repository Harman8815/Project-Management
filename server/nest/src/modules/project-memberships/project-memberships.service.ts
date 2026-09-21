import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectMembershipDto } from "./dto/create-project-membership.dto";
import { UpdateProjectMembershipDto } from "./dto/update-project-membership.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class ProjectMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectMembershipDto: CreateProjectMembershipDto) {
    await this.ensureProjectExists(createProjectMembershipDto.projectId);
    await this.ensureUserExists(createProjectMembershipDto.userId);

    return this.prisma.projectMembership.create({
      data: {
        projectId: createProjectMembershipDto.projectId,
        userId: createProjectMembershipDto.userId,
        role: createProjectMembershipDto.role || "MEMBER",
        status: createProjectMembershipDto.status || "ACTIVE",
        invitedById: createProjectMembershipDto.invitedById,
      },
      include: {
        user: true,
        project: true,
        invitedBy: true,
      },
    });
  }

  async invite(
    projectId: number,
    cognitoId: string,
    role: string = "MEMBER",
    invitedById?: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoId },
    });
    if (!user) {
      throw new NotFoundException(`User with cognitoId ${cognitoId} not found`);
    }

    await this.ensureProjectExists(projectId);

    const existing = await this.prisma.projectMembership.findFirst({
      where: { projectId, userId: user.userId },
    });
    if (existing) {
      throw new BadRequestException(
        `User ${user.username} is already a member of this project`,
      );
    }

    return this.prisma.projectMembership.create({
      data: {
        projectId,
        userId: user.userId,
        role,
        status: "INVITED",
        invitedById,
      },
      include: {
        user: true,
        project: true,
        invitedBy: true,
      },
    });
  }

  async findAll(query: PaginationDto & { projectId?: number; search?: string }) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.search) {
      where.user = { username: { contains: query.search } };
    }
    if (query.projectId) {
      where.projectId = Number(query.projectId);
    }

    const [data, total] = await Promise.all([
      this.prisma.projectMembership.findMany({
        skip,
        take,
        where,
        include: {
          user: true,
          project: true,
          invitedBy: true,
        },
      }),
      this.prisma.projectMembership.count({ where }),
    ]);
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 10 },
    };
  }

  async findOne(id: number) {
    const membership = await this.prisma.projectMembership.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
        invitedBy: true,
      },
    });
    if (!membership) {
      throw new NotFoundException(
        `ProjectMembership with id ${id} not found`,
      );
    }
    return membership;
  }

  async findByProject(projectId: number, query: PaginationDto) {
    const { skip, take } = getPaginationParams(query);

    await this.ensureProjectExists(projectId);

    const [data, total] = await Promise.all([
      this.prisma.projectMembership.findMany({
        where: { projectId },
        skip,
        take,
        include: {
          user: true,
          invitedBy: true,
        },
      }),
      this.prisma.projectMembership.count({ where: { projectId } }),
    ]);
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 10 },
    };
  }

  async findByUser(userId: number, query: PaginationDto) {
    const { skip, take } = getPaginationParams(query);

    await this.ensureUserExists(userId);

    const [data, total] = await Promise.all([
      this.prisma.projectMembership.findMany({
        where: { userId },
        skip,
        take,
        include: {
          project: true,
          invitedBy: true,
        },
      }),
      this.prisma.projectMembership.count({ where: { userId } }),
    ]);
    return {
      data,
      meta: { total, page: query.page || 1, limit: query.limit || 10 },
    };
  }

  async update(
    id: number,
    updateProjectMembershipDto: UpdateProjectMembershipDto,
  ) {
    const membership = await this.prisma.projectMembership.findUnique({
      where: { id },
    });
    if (!membership) {
      throw new NotFoundException(
        `ProjectMembership with id ${id} not found`,
      );
    }
    return this.prisma.projectMembership.update({
      where: { id },
      data: updateProjectMembershipDto,
      include: {
        user: true,
        project: true,
        invitedBy: true,
      },
    });
  }

  async remove(id: number) {
    const membership = await this.prisma.projectMembership.findUnique({
      where: { id },
    });
    if (!membership) {
      throw new NotFoundException(
        `ProjectMembership with id ${id} not found`,
      );
    }
    return this.prisma.projectMembership.delete({
      where: { id },
    });
  }

  async checkUserAccess(
    userId: number,
    projectId: number,
    requiredRoles: string[] = [],
  ): Promise<boolean> {
    const membership = await this.prisma.projectMembership.findFirst({
      where: { userId, projectId, status: "ACTIVE" },
    });
    if (!membership) {
      return false;
    }
    if (requiredRoles.length > 0) {
      return requiredRoles.includes(membership.role);
    }
    return true;
  }

  private async ensureProjectExists(projectId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${projectId} not found`);
    }
  }

  private async ensureUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
  }
}
