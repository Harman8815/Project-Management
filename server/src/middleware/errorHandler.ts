import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/error";

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
      ...(process.env.NODE_ENV === "development" && {
        stack: error.stack,
      }),
    });
  }

  if (error.name === "ZodError") {
    return res.status(400).json({
      status: "fail",
      message: "Validation failed",
      issues: (error as any).issues,
    });
  }

  if (error.name === "PrismaClientKnownRequestError") {
    const prismaError = error as any;
    if (prismaError.code === "P2002") {
      return res.status(409).json({
        status: "error",
        message: "A record with this value already exists",
        fields: prismaError.meta?.target,
      });
    }
    if (prismaError.code === "P2025") {
      return res.status(404).json({
        status: "error",
        message: "Resource not found",
      });
    }
    if (prismaError.code === "P2003") {
      return res.status(409).json({
        status: "error",
        message: "Foreign key constraint violation",
      });
    }
  }

  console.error("Unhandled error:", error);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
}
