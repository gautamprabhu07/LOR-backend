import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors/ForbiddenError.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    // Auth middleware already ran → req.user must exist
    if (!req.user) {
      return next(new ForbiddenError("User not authenticated"));
    }

    const { role } = req.user;

    // Exact role match only (no privilege escalation)
    if (!allowedRoles.includes(role)) {
      return next(
        new ForbiddenError(
          `Role "${role}" not permitted for this action`
        )
      );
    }

    // Ownership/resource checks belong in services
    next();
  };
};
