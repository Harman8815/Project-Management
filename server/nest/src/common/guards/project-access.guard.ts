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

export const PROJECT_ROLE_KEY = "projectRole";
export const RequireProjectRole = (...roles: string[]) =>
  SetMetadata(PROJECT_ROLE_KEY, roles);

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const projectIdParam = this.reflector.get<string>(
      PROJECT_ACCESS_KEY,
      context.getHandler(),
    );

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

    const userId = user.userId || user.sub;
    const membership = await this.prisma.projectMembership.findFirst({
      where: {
        projectId: projectId,
        userId: userId,
        status: "ACTIVE",
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        "You do not have access to this project",
      );
    }

    const requiredRoles = this.reflector.get<string[]>(
      PROJECT_ROLE_KEY,
      context.getHandler(),
    );

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(membership.role)) {
        throw new ForbiddenException(
          `You need one of the following roles: ${requiredRoles.join(", ")}`,
        );
      }
    }

    request.projectMembership = membership;
    return true;
  }
}
