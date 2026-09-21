import { Module } from "@nestjs/common";
import { CustomFieldsController } from "./custom-fields.controller";
import { CustomFieldsService } from "./custom-fields.service";
import { OrganizationsModule } from "../organizations/organizations.module";

@Module({ imports: [OrganizationsModule], controllers: [CustomFieldsController], providers: [CustomFieldsService], exports: [CustomFieldsService] })
export class CustomFieldsModule {}
