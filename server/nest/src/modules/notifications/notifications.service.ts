import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateNotificationDto, NotificationType } from "./dto/create-notification.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        link: createNotificationDto.link,
        activityLogId: createNotificationDto.activityLogId,
      },
    });
  }

  async notifyUser(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
    activityLogId?: number,
  ) {
    return this.create({
      userId,
      type,
      title,
      message,
      link,
      activityLogId,
    });
  }

  async findAll(
    query: PaginationDto & {
      userId?: number;
      unreadOnly?: boolean;
      type?: string;
    },
  ) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.userId) {
      where.userId = Number(query.userId);
    }
    if (query.unreadOnly) {
      where.read = false;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return notification;
  }

  async markAsRead(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { count: await this.prisma.notification.count({ where: { userId, read: true } }) };
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async remove(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with id ${id} not found`);
    }
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async deleteAllForUser(userId: number) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }
}
