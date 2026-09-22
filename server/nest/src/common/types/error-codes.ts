import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  PROJECT_NOT_FOUND = "PROJECT_NOT_FOUND",
  TASK_NOT_FOUND = "TASK_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  TEAM_NOT_FOUND = "TEAM_NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  PROJECT_ACCESS_DENIED = "PROJECT_ACCESS_DENIED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  CONFLICT = "CONFLICT",
  DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
  INVALID_STATUS_TRANSITION = "INVALID_STATUS_TRANSITION",
  CIRCULAR_DEPENDENCY = "CIRCULAR_DEPENDENCY",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export function getErrorCode(exception: unknown): ErrorCode {
  if (exception instanceof BadRequestException) {
    const message = exception.message;
    if (message.includes("status transition")) {
      return ErrorCode.INVALID_STATUS_TRANSITION;
    }
    if (message.includes("circular")) {
      return ErrorCode.CIRCULAR_DEPENDENCY;
    }
    return ErrorCode.VALIDATION_ERROR;
  }
  if (exception instanceof NotFoundException) {
    const message = exception.message;
    if (message.includes("Project")) {
      return ErrorCode.PROJECT_NOT_FOUND;
    }
    if (message.includes("Task")) {
      return ErrorCode.TASK_NOT_FOUND;
    }
    if (message.includes("User")) {
      return ErrorCode.USER_NOT_FOUND;
    }
    if (message.includes("Team")) {
      return ErrorCode.TEAM_NOT_FOUND;
    }
    return ErrorCode.NOT_FOUND;
  }
  if (exception instanceof UnauthorizedException) {
    return ErrorCode.UNAUTHORIZED;
  }
  if (exception instanceof ForbiddenException) {
    const message = exception.message;
    if (message.includes("access to this project")) {
      return ErrorCode.PROJECT_ACCESS_DENIED;
    }
    if (message.includes("roles")) {
      return ErrorCode.INSUFFICIENT_PERMISSIONS;
    }
    return ErrorCode.FORBIDDEN;
  }
  return ErrorCode.INTERNAL_ERROR;
}
