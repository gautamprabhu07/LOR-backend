import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../users/user.model.js";
import { env } from "../../config/env.js";
import { BadRequestError } from "../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../core/errors/ForbiddenError.js";
export const authService = {
    async login(email, password) {
        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user) {
            throw new BadRequestError("Invalid credentials");
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            throw new BadRequestError("Invalid credentials");
        }
        if (user.status !== "active") {
            throw new ForbiddenError("Account is not active");
        }
        const payload = {
            sub: user._id.toString(),
            role: user.role
        };
        const jwtSecret = env.JWT_ACCESS_SECRET;
        const jwtExpiresIn = env.JWT_ACCESS_EXPIRES_IN || "15m";
        const accessToken = jwt.sign(payload, jwtSecret, {
            expiresIn: jwtExpiresIn
        });
        return {
            userId: user._id.toString(),
            role: user.role,
            accessToken
        };
    },
    async hashPassword(password) {
        return bcrypt.hash(password, 12);
    },
    decodeToken(token) {
        const jwtSecret = env.JWT_ACCESS_SECRET;
        try {
            const decoded = jwt.verify(token, jwtSecret);
            return {
                userId: decoded.sub,
                role: decoded.role
            };
        }
        catch {
            throw new BadRequestError("Invalid token");
        }
    }
};
