import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateProjectMembershipDto } from "./dto/create-project-membership.dto";
import { UpdateProjectMembershipDto } from "./dto/update-project-membership.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class ProjectMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectMembershipDto: CreateProjectMembershipDto) {
    return this.prisma.projectTeam.create({
      data: {
        projectId: createProjectMembershipDto.projectId,
        teamId: createProjectMembershipDto.teamId,
      },
      include: {
        project: true,
        team: true,
      },
    });
  }

  async findAll(query: PaginationDto) {
    const { skip, take } = getPaginationParams(query);
    const [data, total] = await Promise.all([
      this.prisma.projectTeam.findMany({
        skip,
        take,
        include: {
          project: true,
          team: true,
        },
      }),
      this.prisma.projectTeam.count(),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number) {
    const projectTeam = await this.prisma.projectTeam.findUnique({
      where: { id },
      include: {
        project: true,
        team: true,
      },
    });
    if (!projectTeam) {
      throw new NotFoundException(`ProjectTeam with id ${id} not found`);
    }
    return projectTeam;
  }

  async update(id: number, updateProjectMembershipDto: UpdateProjectMembershipDto) {
    const projectTeam = await this.prisma.projectTeam.findUnique({
      where: { id },
    });
    if (!projectTeam) {
      throw new NotFoundException(`ProjectTeam with id ${id} not found`);
    }
    return this.prisma.projectTeam.update({
      where: { id },
      data: updateProjectMembershipDto,
      include: {
        project: true,
        team: true,
      },
    });
  }

  async remove(id: number) {
    const projectTeam = await this.prisma.projectTeam.findUnique({
      where: { id },
    });
    if (!projectTeam) {
      throw new NotFoundException(`ProjectTeam with id ${id} not found`);
    }
    return this.prisma.projectTeam.delete({
      where: { id },
    });
  }
}
