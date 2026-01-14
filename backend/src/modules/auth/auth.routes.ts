import { Router } from "express";
import { rateLimit } from "express-rate-limit"; // npm i express-rate-limit @types/express-rate-limit
import { authController } from "./auth.controller.js";
import { auth } from "../../core/middleware/auth.js"; // will create below
import { requireRole } from "../../core/middleware/requireRole.js";

const router = Router({ mergeParams: false });

// Rate limiting for login (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: { status: "error", message: "Too many login attempts" }
});

// Public routes (no auth required)
/**
 * @POST /auth/login
 * Login and receive JWT cookie
 */
router.post("/login", loginLimiter, authController.login);

/**
 * @POST /auth/logout
 * Clear JWT cookie
 */
router.post("/logout", auth, authController.logout);

/**
 * @GET /auth/me
 * Get current user info
 */
router.get("/me", auth, authController.me);

/**
 * @POST /auth/admin/users
 * Admin-only user management
 */
router.post("/admin/users", auth, requireRole("admin"), authController.createUser);

export const authRouter = router;
