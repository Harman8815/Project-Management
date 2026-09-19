import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    cognitoId: string;
  };
}

const PUBLIC_PATHS = ["/users"];

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const path = req.path;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  if (isPublic) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authorization header missing or invalid",
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.COGNITO_JWT_SECRET || "") as {
      "cognito:username"?: string;
      username?: string;
      sub?: string;
    };

    req.user = {
      userId: decoded.sub || decoded.username || "",
      cognitoId: decoded.sub || decoded.username || "",
    };
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
}
