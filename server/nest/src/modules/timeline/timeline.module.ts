import { Module } from "@nestjs/common";
import { TimelineController } from "./timeline.controller";
import { ProjectsModule } from "../projects/projects.module";

@Module({
  imports: [ProjectsModule],
  controllers: [TimelineController],
})
export class TimelineModule {}
