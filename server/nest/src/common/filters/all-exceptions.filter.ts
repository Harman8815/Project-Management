import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { ErrorCode, getErrorCode } from "../types/error-codes";

interface ErrorResponse {
  status: "error" | "fail";
  message: string | object;
  code?: ErrorCode;
  timestamp?: string;
  path?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    let message =
      exception instanceof HttpException
        ? exception.message
        : exception instanceof Error
          ? exception.message
          : "Internal server error";

    let code = getErrorCode(exception);

    if (exception instanceof PrismaClientKnownRequestError) {
      status = this.handlePrismaError(exception);
      code = ErrorCode.CONFLICT;
      if (exception.code === "P2025") {
        code = ErrorCode.NOT_FOUND;
        message = "Resource not found";
      }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse: ErrorResponse = {
      status: status >= 500 ? "error" : "fail",
      message,
      code,
      ...(process.env.NODE_ENV === "development" && {
        timestamp: new Date().toISOString(),
        path: request.url,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private handlePrismaError(error: PrismaClientKnownRequestError): number {
    switch (error.code) {
      case "P2002":
        return 409;
      case "P2003":
        return 409;
      case "P2025":
        return 404;
      default:
        return 500;
    }
  }
}
