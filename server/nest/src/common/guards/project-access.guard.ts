import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SetMetadata } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export const PROJECT_ACCESS_KEY = "projectAccess";
export const RequireProjectAccess = (projectIdParam: string = "id") =>
  SetMetadata(PROJECT_ACCESS_KEY, projectIdParam);

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const projectIdParam = this.reflector.get<string>(PROJECT_ACCESS_KEY, context.getHandler());

    if (!projectIdParam) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    const projectId = parseInt(request.params[projectIdParam], 10);

    if (isNaN(projectId)) {
      return true;
    }

    const hasAccess = await this.prisma.projectTeam.findFirst({
      where: {
        projectId: projectId,
        team: {
          user: {
            some: {
              cognitoId: user.cognitoId || user.username,
            },
          },
        },
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        "You do not have access to this project",
      );
    }

    return true;
  }
}
