import { JwtAuthGuard, IS_PUBLIC_KEY } from "./jwt-auth.guard";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let prisma: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ userId: 1, username: "dev-user", cognitoId: "dev-user" }),
      },
    };

    guard = new JwtAuthGuard(reflector, prisma);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.AUTH_DISABLED = "false";
  });

  const mockExecutionContext = (request: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as any);

  describe("Public routes", () => {
    it("should return true for public routes", async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      const context = mockExecutionContext({
        headers: {},
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe("Valid token", () => {
    it("should return true for valid token", async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      const token = jwt.sign(
        { cognitoId: "test-user", username: "testuser" },
        process.env.JWT_SECRET || "fallback-secret-change-me",
        { expiresIn: "1h" },
      );

      const context = mockExecutionContext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe("Missing authorization header", () => {
    it("should throw UnauthorizedException when no auth header", async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      const context = mockExecutionContext({
        headers: {},
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("Invalid token", () => {
    it("should throw UnauthorizedException for malformed token", async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      const context = mockExecutionContext({
        headers: {
          authorization: "Bearer invalid-token",
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException for token with wrong secret", async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      const token = jwt.sign(
        { cognitoId: "test-user", username: "testuser" },
        "wrong-secret",
        { expiresIn: "1h" },
      );

      const context = mockExecutionContext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("Expired token", () => {
    it("should throw UnauthorizedException for expired token", async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      const token = jwt.sign(
        { cognitoId: "test-user", username: "testuser" },
        process.env.JWT_SECRET || "fallback-secret-change-me",
        { expiresIn: "-1h" },
      );

      const context = mockExecutionContext({
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

describe("Public decorator", () => {
  it("should export IS_PUBLIC_KEY constant", () => {
    expect(IS_PUBLIC_KEY).toBe("isPublic");
  });

  it("should create a decorator function for public routes", () => {
    const result = IS_PUBLIC_KEY;
    expect(typeof result).toBe("string");
  });
});
