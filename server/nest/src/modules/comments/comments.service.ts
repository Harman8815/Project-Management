import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { getPaginationParams } from "../../common/utils/pagination.util";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: number) {
    // Ensure task exists and user has access
    if (createCommentDto.taskId) {
      await this.ensureTaskExists(createCommentDto.taskId);
      await this.checkTaskAccess(authorId, createCommentDto.taskId);
    }

    // Check parent comment exists if provided
    if (createCommentDto.parentId) {
      await this.ensureCommentExists(createCommentDto.parentId);
    }

    // Extract mentions from comment text (@username)
    const mentions = this.extractMentions(createCommentDto.text);

    return this.prisma.$transaction(async (prisma) => {
      const comment = await prisma.comment.create({
        data: {
          text: createCommentDto.text,
          taskId: createCommentDto.taskId,
          userId: authorId,
          parentId: createCommentDto.parentId,
        },
        include: {
          user: true,
          task: true,
          parent: true,
        },
      });

      // Create activity log
      if (createCommentDto.taskId) {
        await prisma.activityLog.create({
          data: {
            eventType: "COMMENT_CREATED",
            actorId: authorId,
            taskId: createCommentDto.taskId,
            message: `Comment added: ${createCommentDto.text.substring(0, 50)}...`,
          },
        });
      }

      // Process mentions and create notifications
      for (const username of mentions) {
        const mentionedUser = await prisma.user.findUnique({
          where: { username },
        });

        if (mentionedUser && mentionedUser.userId !== authorId) {
          // Create comment mention record
          await prisma.commentMention.create({
            data: {
              commentId: comment.id,
              mentionedUserId: mentionedUser.userId,
            },
          });

          // Create notification
          await this.notificationsService.create({
            userId: mentionedUser.userId,
            type: "MENTION",
            title: "You were mentioned in a comment",
            message: `${comment.user?.username} mentioned you in a comment`,
            link: `/tasks/${createCommentDto.taskId}`,
          });
        }
      }

      return comment;
    });
  }

  async findAll(query: PaginationDto & { taskId?: number }, userId?: number) {
    const { skip, take } = getPaginationParams(query);

    const where: any = {};
    if (query.taskId) {
      where.taskId = Number(query.taskId);
      
      // Check if user has access to the task
      if (userId) {
        await this.checkTaskAccess(userId, Number(query.taskId));
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where,
        skip,
        take,
        include: {
          user: true,
          task: true,
          parent: true,
          replies: {
            include: {
              user: true,
            },
          },
          mentions: {
            include: {
              mentionedBy: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.comment.count({ where }),
    ]);
    return { data, meta: { total, page: query.page || 1, limit: query.limit || 10 } };
  }

  async findOne(id: number, userId?: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
        task: true,
        parent: true,
        replies: {
          include: {
            user: true,
          },
        },
        mentions: {
          include: {
            mentionedBy: true,
          },
        },
      },
    });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    // Check if user has access to the task
    if (comment.taskId && userId) {
      await this.checkTaskAccess(userId, comment.taskId);
    }

    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, authorId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    // Only the author can update their own comments
    if (comment.userId !== authorId) {
      throw new ForbiddenException("You can only update your own comments");
    }

    // Extract new mentions
    const mentions = this.extractMentions(updateCommentDto.text || "");

    return this.prisma.$transaction(async (prisma) => {
      const updatedComment = await prisma.comment.update({
        where: { id },
        data: {
          text: updateCommentDto.text,
        },
        include: {
          user: true,
          task: true,
          parent: true,
        },
      });

      // Create activity log
      if (comment.taskId) {
        await prisma.activityLog.create({
          data: {
            eventType: "COMMENT_UPDATED",
            actorId: authorId,
            taskId: comment.taskId,
            message: `Comment updated`,
          },
        });
      }

      // Process new mentions
      for (const username of mentions) {
        const mentionedUser = await prisma.user.findUnique({
          where: { username },
        });

        if (mentionedUser && mentionedUser.userId !== authorId) {
          // Check if mention already exists
          const existingMention = await prisma.commentMention.findFirst({
            where: {
              commentId: id,
              mentionedUserId: mentionedUser.userId,
            },
          });

          if (!existingMention) {
            await prisma.commentMention.create({
              data: {
                commentId: id,
                mentionedUserId: mentionedUser.userId,
              },
            });

            // Create notification
            await this.notificationsService.create({
              userId: mentionedUser.userId,
              type: "MENTION",
              title: "You were mentioned in a comment",
              message: `${updatedComment.user?.username} mentioned you in a comment`,
              link: `/tasks/${comment.taskId}`,
            });
          }
        }
      }

      return updatedComment;
    });
  }

  async remove(id: number, authorId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    // Only the author can delete their own comments
    if (comment.userId !== authorId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    return this.prisma.$transaction(async (prisma) => {
      // Delete mentions
      await prisma.commentMention.deleteMany({
        where: { commentId: id },
      });

      // Delete replies
      await prisma.comment.deleteMany({
        where: { parentId: id },
      });

      // Delete comment
      await prisma.comment.delete({
        where: { id },
      });

      // Create activity log
      if (comment.taskId) {
        await prisma.activityLog.create({
          data: {
            eventType: "COMMENT_DELETED",
            actorId: authorId,
            taskId: comment.taskId,
            message: `Comment deleted`,
          },
        });
      }

      return { message: "Comment deleted successfully" };
    });
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    return mentions;
  }

  private async ensureTaskExists(taskId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });
    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }
  }

  private async ensureCommentExists(commentId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException(`Comment with id ${commentId} not found`);
    }
  }

  private async checkTaskAccess(userId: number, taskId: number): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with id ${taskId} not found`);
    }

    const membership = await this.prisma.projectMembership.findFirst({
      where: {
        userId,
        projectId: task.projectId,
        status: "ACTIVE",
      },
    });

    if (!membership) {
      throw new ForbiddenException("You do not have access to this task");
    }
  }
}
