import { Router } from "express";
import { auth } from "../../core/middleware/auth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import * as facultyProfileController from "./facultyProfile.controller.js";

/**
 * FACULTY PROFILE ROUTES
 * Mounted at: /api/faculty/profile
 * 
 * 🔒 Security:
 * - All routes require authentication
 * - Main routes require "faculty" role
 * - Admin listing requires "admin" role
 */

const router = Router();

// Apply auth middleware to all routes
router.use(auth);

/**
 * Faculty routes (require "faculty" role)
 */
router.get("/", requireRole("faculty"), facultyProfileController.getProfile);
router.patch("/", requireRole("faculty"), facultyProfileController.updateProfile);

/**
 * Admin routes (require "admin" role)
 * Mounted at: /api/faculty/profiles (note the plural)
 * This should be registered separately in the main app
 */
export const adminRouter = Router();
adminRouter.use(auth);
adminRouter.get("/", requireRole("admin"), facultyProfileController.listProfiles);

/**
 * Directory routes (student/alumni/admin)
 * Mounted at: /api/faculty/directory
 */
export const directoryRouter = Router();
directoryRouter.use(auth);
directoryRouter.get(
	"/",
	requireRole("student", "alumni", "admin"),
	facultyProfileController.listDirectory
);

export default router;
