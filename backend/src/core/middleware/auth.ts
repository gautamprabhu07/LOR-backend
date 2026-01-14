import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

interface JwtPayload {
  sub: string;
  role: string;
}

export const auth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    // Extract token (Cookie PRIMARY, Header SECONDARY)
    let token: string | undefined;

    // 1. Cookie (preferred)
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    // 2. Authorization header (fallback)
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new UnauthorizedError());
    }

    // Verify JWT (stateless)
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    // Attach minimal user object
    req.user = {
      id: decoded.sub,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(new UnauthorizedError());
  }
};
