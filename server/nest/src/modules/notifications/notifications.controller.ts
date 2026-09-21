import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "userId", required: false })
  @ApiQuery({ name: "unreadOnly", required: false })
  @ApiQuery({ name: "type", required: false })
  @Get()
  async findAll(
    @Query()
    query: PaginationDto & {
      userId?: number;
      unreadOnly?: boolean;
      type?: string;
    },
  ) {
    return this.notificationsService.findAll(query);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.notificationsService.findOne(Number(id));
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string) {
    return this.notificationsService.markAsRead(Number(id));
  }

  @Patch("user/:userId/read-all")
  async markAllAsRead(@Param("userId") userId: string) {
    return this.notificationsService.markAllAsRead(Number(userId));
  }

  @Get("user/:userId/unread-count")
  async getUnreadCount(@Param("userId") userId: string) {
    const count = await this.notificationsService.getUnreadCount(Number(userId));
    return { count };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.notificationsService.remove(Number(id));
  }

  @Delete("user/:userId/all")
  async deleteAllForUser(@Param("userId") userId: string) {
    return this.notificationsService.deleteAllForUser(Number(userId));
  }
}
