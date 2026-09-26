import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PrismaModule } from "./prisma/prisma.module";
import { envValidationSchema } from "./config/env.validation";
import { UsersModule } from "./modules/users/users.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { SearchModule } from "./modules/search/search.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { ProjectMembershipsModule } from "./modules/project-memberships/project-memberships.module";
import { ProjectTemplatesModule } from "./modules/project-templates/project-templates.module";
import { MilestonesModule } from "./modules/milestones/milestones.module";
import { SprintsModule } from "./modules/sprints/sprints.module";
import { ActivityLogModule } from "./modules/activity-log/activity-log.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { ExportModule } from "./modules/export/export.module";
import { PortfolioModule } from "./modules/portfolio/portfolio.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { CustomFieldsModule } from "./modules/custom-fields/custom-fields.module";
import { IntegrationsModule } from "./modules/integrations/integrations.module";
import { AiModule } from "./modules/ai/ai.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { DevModule } from "./modules/dev/dev.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local", ".env.nest"],
      validationSchema: envValidationSchema,
    }),
    UsersModule,
    ProjectsModule,
    TasksModule,
    SearchModule,
    TeamsModule,
    ProjectMembershipsModule,
    ProjectTemplatesModule,
    MilestonesModule,
    SprintsModule,
    ActivityLogModule,
    NotificationsModule,
    AnalyticsModule,
    ReportsModule,
    ExportModule,
    PortfolioModule,
    OrganizationsModule,
    CustomFieldsModule,
    IntegrationsModule,
    AiModule,
    CommentsModule,
    PrismaModule,
    WorkflowsModule,
    CalendarModule,
    DevModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
