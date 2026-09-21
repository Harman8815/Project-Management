import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({ imports: [OrganizationsModule], controllers: [AiController], providers: [AiService] })
export class AiModule {}
