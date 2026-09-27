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

export enum ErrorCode {
  AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED",
  AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID",
  AUTH_TOKEN_REVOKED = "AUTH_TOKEN_REVOKED",
}

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
      throw new UnauthorizedException({
        message: "Missing or invalid authorization header",
        errorCode: ErrorCode.AUTH_TOKEN_INVALID,
      });
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
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException({
          message: "Token has expired",
          errorCode: ErrorCode.AUTH_TOKEN_EXPIRED,
        });
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new UnauthorizedException({
          message: "Token not yet valid",
          errorCode: ErrorCode.AUTH_TOKEN_INVALID,
        });
      }
      throw new UnauthorizedException({
        message: "Invalid or revoked token",
        errorCode: ErrorCode.AUTH_TOKEN_REVOKED,
      });
    }
  }
}
