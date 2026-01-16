import { z } from "zod";
import { authService } from "./auth.service.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { env } from "../../config/env.js";
import { User } from "../users/user.model.js";
import { BadRequestError } from "../../core/errors/BadRequestError.js";
// Input validation schemas
const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters")
});
const createUserSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["student", "faculty", "admin"])
});
const logoutSchema = z.object({});
export const authController = {
    /**
     * POST /auth/login
     */
    login: asyncHandler(async (req, res) => {
        const { email, password } = loginSchema.parse(req.body);
        const result = await authService.login(email, password);
        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: env.COOKIE_SECURE === "true",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
            domain: env.COOKIE_DOMAIN || undefined
        });
        res.status(200).json({
            status: "success",
            data: {
                userId: result.userId,
                role: result.role
            }
        });
    }),
    /**
     * POST /auth/logout
     */
    logout: asyncHandler(async (_req, res) => {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: env.COOKIE_SECURE === "true",
            sameSite: "strict"
        });
        res.status(200).json({ status: "success", message: "Logged out" });
    }),
    /**
     * GET /auth/me
    */
    me: asyncHandler(async (req, res) => {
        if (!req.user) {
            throw new Error("User not found"); // caught by auth middleware
        }
        res.status(200).json({
            status: "success",
            data: {
                userId: req.user.id,
                role: req.user.role
            }
        });
    }),
    /**
     * POST /auth/admin/users
     * Admin-only user creation
     */
    createUser: asyncHandler(async (req, res) => {
        const { email, password, role } = createUserSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new BadRequestError("User with this email already exists");
        }
        // Hash password
        const passwordHash = await authService.hashPassword(password);
        // Create user
        const user = await User.create({
            email,
            passwordHash,
            role,
            status: "active"
        });
        res.status(201).json({
            status: "success",
            data: {
                userId: user._id.toString(),
                email: user.email,
                role: user.role
            }
        });
    })
};
