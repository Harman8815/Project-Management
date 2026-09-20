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
    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        skip,
        take,
        include: {
          projectTeams: {
            include: {
              project: true,
            },
          },
        },
      }),
      this.prisma.team.count(),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
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
    return team;
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
}
