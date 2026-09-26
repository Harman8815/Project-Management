import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "../../prisma/prisma.service";

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (process.env.AUTH_DISABLED === "true") {
      const request = context.switchToHttp().getRequest() as Request & {
        user?: unknown;
      };
      const devUser = await this.prisma.user.findUnique({
        where: { cognitoId: "dev-user" },
        select: { userId: true, username: true, cognitoId: true },
      });
      request.user = devUser
        ? { userId: devUser.userId, username: devUser.username, cognitoId: devUser.cognitoId }
        : { username: "dev-user", cognitoId: "dev-user" };
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as Request & {
      user?: unknown;
    };
    const authHeader = (request as Request).headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid authorization header",
      );
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret-change-me",
      );
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
