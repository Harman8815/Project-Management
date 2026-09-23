import { Body, Controller, Param, Post, Get, Put, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("ai")
@ApiBearerAuth()
@Controller("organizations/:organizationId/ai")
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post("answer")
  answer(@Param("organizationId") organizationId: string, @Body() body: { projectId?: number; prompt: string; confirmMutation?: boolean; feature?: string }, @CurrentUser() user: any) {
    return this.service.answer(user.userId, Number(organizationId), body);
  }

  @Post("feedback")
  feedback(@Body() body: { requestId: number; rating: number; comment?: string }, @CurrentUser() user: any) {
    return this.service.feedback(user.userId, body.requestId, body.rating, body.comment);
  }

  @Put("model-config")
  setModelConfig(@Param("organizationId") organizationId: string, @Body() body: { config: any }, @CurrentUser() user: any) {
    return this.service.setModelConfig(Number(organizationId), user.userId, body.config);
  }

  @Get("model-config")
  getModelConfig(@Param("organizationId") organizationId: string, @CurrentUser() user: any) {
    return this.service.getModelConfig(Number(organizationId), user.userId);
  }

  @Post("search")
  naturalLanguageSearch(@Param("organizationId") organizationId: string, @Body() body: { query: string; projectId?: number }, @CurrentUser() user: any) {
    return this.service.naturalLanguageSearch(user.userId, Number(organizationId), body.query, body.projectId);
  }

  @Post("report")
  generateReport(@Param("organizationId") organizationId: string, @Body() body: { projectId: number; reportType: string }, @CurrentUser() user: any) {
    return this.service.generateReport(user.userId, Number(organizationId), body.projectId, body.reportType);
  }

  @Post("task-breakdown")
  suggestTaskBreakdown(@Param("organizationId") organizationId: string, @Body() body: { projectId: number; taskTitle: string; taskDescription?: string }, @CurrentUser() user: any) {
    return this.service.suggestTaskBreakdown(user.userId, Number(organizationId), body.projectId, body.taskTitle, body.taskDescription);
  }

  @Post("planning")
  assistPlanning(@Param("organizationId") organizationId: string, @Body() body: { projectId: number; timeframe: string; capacity?: number }, @CurrentUser() user: any) {
    return this.service.assistPlanning(user.userId, Number(organizationId), body.projectId, body.timeframe, body.capacity);
  }
}
