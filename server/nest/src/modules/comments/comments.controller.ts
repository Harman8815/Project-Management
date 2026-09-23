import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectAccessGuard, RequireProjectAccess } from "../../common/guards/project-access.guard";

@ApiTags("comments")
@ApiBearerAuth()
@Controller("comments")
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("taskId")
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.create(createCommentDto, user?.userId);
  }

  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "taskId", required: false })
  @Get()
  async findAll(
    @Query() query: PaginationDto & { taskId?: number },
    @CurrentUser() user: any,
  ) {
    return this.commentsService.findAll(query, user?.userId);
  }

  @Get(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("taskId")
  async findOne(@Param("id") id: string, @CurrentUser() user: any) {
    return this.commentsService.findOne(Number(id), user?.userId);
  }

  @Patch(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("taskId")
  async update(
    @Param("id") id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.commentsService.update(Number(id), updateCommentDto, user?.userId);
  }

  @Delete(":id")
  @UseGuards(ProjectAccessGuard)
  @RequireProjectAccess("taskId")
  async remove(@Param("id") id: string, @CurrentUser() user: any) {
    return this.commentsService.remove(Number(id), user?.userId);
  }
}
