import { Body, Controller, Param, Post, Req } from "@nestjs/common";
import { AiService } from "./ai.service";

@Controller("organizations/:organizationId/ai")
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post("answer")
  answer(@Req() request: any, @Param("organizationId") organizationId: string, @Body() body: { projectId?: number; prompt: string; confirmMutation?: boolean }) {
    return this.service.answer(request.user.userId, Number(organizationId), body);
  }

  @Post("feedback")
  feedback(@Req() request: any, @Body() body: { requestId: number; rating: number; comment?: string }) {
    return this.service.feedback(request.user.userId, body.requestId, body.rating, body.comment);
  }
}
