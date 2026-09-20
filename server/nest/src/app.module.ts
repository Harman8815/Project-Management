import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PrismaService } from "./prisma/prisma.service";
import { envValidationSchema } from "./config/env.validation";
import { UsersModule } from "./modules/users/users.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { SearchModule } from "./modules/search/search.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { ProjectMembershipsModule } from "./modules/project-memberships/project-memberships.module";
import { ProjectTemplatesModule } from "./modules/project-templates/project-templates.module";
 
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
  ],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
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
