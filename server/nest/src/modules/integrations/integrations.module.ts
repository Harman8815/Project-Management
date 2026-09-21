import { Module } from "@nestjs/common";
import { IntegrationsController } from "./integrations.controller";
import { IntegrationsService } from "./integrations.service";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({ imports: [OrganizationsModule], controllers: [IntegrationsController], providers: [IntegrationsService], exports: [IntegrationsService] })
export class IntegrationsModule {}
