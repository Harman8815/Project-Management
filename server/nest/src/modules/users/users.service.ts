import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

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

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        assignedTasks: true,
        authoredTasks: true,
      },
    });
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
