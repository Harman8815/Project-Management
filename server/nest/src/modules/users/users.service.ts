import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        cognitoId: createUserDto.cognitoId,
        profilePictureUrl: createUserDto.profilePictureUrl,
      },
    });
  }

  async findAll(query: PaginationDto) {
    const { skip, take } = getPaginationParams(query);
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        include: {
          assignedTasks: true,
          authoredTasks: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(cognitoId: string) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoId },
      include: {
        assignedTasks: true,
        authoredTasks: true,
      },
    });
    if (!user) {
      throw new NotFoundException(
        `User with cognitoId ${cognitoId} not found`,
      );
    }
    return user;
  }

  async update(cognitoId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoId },
    });
    if (!user) {
      throw new NotFoundException(
        `User with cognitoId ${cognitoId} not found`,
      );
    }
    return this.prisma.user.update({
      where: { cognitoId },
      data: updateUserDto,
    });
  }

  async remove(cognitoId: string) {
    const user = await this.prisma.user.findUnique({
      where: { cognitoId },
    });
    if (!user) {
      throw new NotFoundException(
        `User with cognitoId ${cognitoId} not found`,
      );
    }
    return this.prisma.user.delete({
      where: { cognitoId },
    });
  }
}
