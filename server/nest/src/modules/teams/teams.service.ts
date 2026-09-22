import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTeamDto } from "./dto/create-team.dto";
import { UpdateTeamDto } from "./dto/update-team.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeamDto: CreateTeamDto) {
    return this.prisma.team.create({
      data: {
        teamName: createTeamDto.teamName,
      },
    });
  }

  async findAll(query: PaginationDto) {
    const { skip, take } = getPaginationParams(query);
    const teams = await this.prisma.team.findMany({
      skip,
      take,
      include: {
        projectTeams: {
          include: {
            project: true,
          },
        },
      },
    });
    const total = await this.prisma.team.count();
    const teamsWithUsernames = await this.enrichWithUsernames(teams);
    return { data: teamsWithUsernames, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        projectTeams: {
          include: {
            project: true,
          },
        },
      },
    });
    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    return this.enrichTeamWithUsernames(team);
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });
    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    return this.prisma.team.update({
      where: { id },
      data: updateTeamDto,
    });
  }

  async remove(id: number) {
    const team = await this.prisma.team.findUnique({
      where: { id },
    });
    if (!team) {
      throw new NotFoundException(`Team with id ${id} not found`);
    }
    return this.prisma.team.delete({
      where: { id },
    });
  }

  private async enrichWithUsernames(teams: any[]) {
    return Promise.all(teams.map((team) => this.enrichTeamWithUsernames(team)));
  }

  private async enrichTeamWithUsernames(team: any) {
    const [productOwner, projectManager] = await Promise.all([
      team.productOwnerUserId
        ? this.prisma.user.findUnique({
            where: { userId: team.productOwnerUserId },
            select: { username: true },
          })
        : null,
      team.projectManagerUserId
        ? this.prisma.user.findUnique({
            where: { userId: team.projectManagerUserId },
            select: { username: true },
          })
        : null,
    ]);
    return {
      ...team,
      productOwnerUsername: productOwner?.username ?? null,
      projectManagerUsername: projectManager?.username ?? null,
    };
  }
}
