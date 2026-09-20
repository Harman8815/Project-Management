import morgan from "morgan";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface RequestWithId extends Request {
  id?: string;
}

morgan.token("id", (req: RequestWithId) => req.id ?? "unknown");

export function requestIdMiddleware(
  req: RequestWithId,
  _res: Response,
  next: NextFunction,
) {
  req.id = (req.headers["x-request-id"] as string) ?? crypto.randomUUID();
  next();
}

export const structuredLogFormat =
  ':remote-addr - [:date[iso]] [reqId::id] ":method :url" :status :res[content-length] - :response-time ms';

export const httpLogger = morgan(structuredLogFormat, {
  stream: {
    write: (message: string) => {
      console.log(message.trim());
    },
  },
});

export function sanitizeMessage(msg: string): string {
  return msg.replace(
    /(password|token|secret|key|authorization)[\s]*[:=][\s]*[^\s]+/gi,
    "$1: [REDACTED]",
  );
}

export function sanitizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveKeys = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-auth-token",
  ];
  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
