import { ForbiddenError } from "../errors/ForbiddenError.js";
export const requireRole = (...allowedRoles) => {
    return (req, _res, next) => {
        // Auth middleware already ran → req.user must exist
        if (!req.user) {
            return next(new ForbiddenError("User not authenticated"));
        }
        const { role } = req.user;
        // Exact role match only (no privilege escalation)
        if (!allowedRoles.includes(role)) {
            return next(new ForbiddenError(`Role "${role}" not permitted for this action`));
        }
        // Ownership/resource checks belong in services
        next();
    };
};
