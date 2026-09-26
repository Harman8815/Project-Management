import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiHeader } from "@nestjs/swagger";
import { DevService } from "./dev.service";

@ApiTags("dev")
@ApiHeader({
  name: "X-Dev-Key",
  description: "Optional dev key for non-dev mode access",
  required: false,
})
@Controller("dev")
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Post("data/populate")
  @HttpCode(200)
  async populate(
    @Query("scale") scale: string,
    @Headers("x-dev-key") devKey?: string,
  ) {
    const validScales = ["small", "medium", "large"];
    const scaleValue = validScales.includes(scale)
      ? (scale as "small" | "medium" | "large")
      : "medium";
    return this.devService.populate(scaleValue, devKey);
  }

  @Post("data/clear")
  @HttpCode(200)
  async clear(
    @Body() body: { models: string[] },
    @Headers("x-dev-key") devKey?: string,
  ) {
    return this.devService.clear(body.models, devKey);
  }

  @Post("data/reset")
  @HttpCode(200)
  async reset(
    @Query("scale") scale: string,
    @Headers("x-dev-key") devKey?: string,
  ) {
    const validScales = ["small", "medium", "large"];
    const scaleValue = validScales.includes(scale)
      ? (scale as "small" | "medium" | "large")
      : "medium";
    return this.devService.reset(scaleValue, devKey);
  }
}
