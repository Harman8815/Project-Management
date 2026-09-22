import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export function getErrorCode(exception: unknown): ErrorCode {
  if (exception instanceof BadRequestException) {
    return ErrorCode.VALIDATION_ERROR;
  }
  if (exception instanceof NotFoundException) {
    return ErrorCode.NOT_FOUND;
  }
  if (exception instanceof UnauthorizedException) {
    return ErrorCode.UNAUTHORIZED;
  }
  if (exception instanceof ForbiddenException) {
    return ErrorCode.FORBIDDEN;
  }
  return ErrorCode.INTERNAL_ERROR;
}
