import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
export const auth = (req, _res, next) => {
    try {
        // Extract token (Cookie PRIMARY, Header SECONDARY)
        let token;
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
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        // Attach minimal user object
        req.user = {
            id: decoded.sub,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        next(new UnauthorizedError());
    }
};
