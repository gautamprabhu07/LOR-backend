import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { submissionController } from "./submission.controller.js";
import { auth } from "../../core/middleware/auth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
const router = Router();
// ⚡ Rate limiting for submission creation (prevent spam)
const createSubmissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 submissions per IP per 15 min
    message: {
        status: "error",
        message: "Too many submissions. Please try again later."
    }
});
// ⚡ Rate limiting for status updates (prevent abuse)
const updateStatusLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 updates per IP per 5 min
    message: {
        status: "error",
        message: "Too many status updates. Please try again later."
    }
});
/**
 * 🟢 PUBLIC ENDPOINTS (with auth)
 */
/**
 * POST /api/submissions
 * Create new LoR submission
 * 🔒 Student/Alumni only
 */
router.post("/", auth, requireRole("student", "alumni"), createSubmissionLimiter, submissionController.create);
/**
 * GET /api/submissions
 * List submissions (filtered by role)
 * 🔒 Students see their own, Faculty see assigned
 */
router.get("/", auth, submissionController.list);
/**
 * GET /api/submissions/:id
 * Get single submission details
 * 🔒 Ownership validated in service
 */
router.get("/:id", auth, submissionController.getById);
/**
 * POST /api/submissions/:id/status
 * Update submission status
 * 🔒 Faculty OR Student (based on transition rules)
 */
router.post("/:id/status", auth, updateStatusLimiter, submissionController.updateStatus);
/**
 * DELETE /api/submissions/:id
 * Soft delete submission
 * 🔒 Student only, before approved
 */
router.delete("/:id", auth, requireRole("student", "alumni"), submissionController.delete);
/**
 * 🟡 FACULTY-SPECIFIC ENDPOINTS
 */
/**
 * GET /api/submissions/faculty/pending
 * Faculty dashboard - pending submissions only
 * 🔒 Faculty only
 */
router.get("/faculty/pending", auth, requireRole("faculty"), asyncHandler(async (req, res, next) => {
    // Set status filter for pending submissions
    req.query.status = "submitted";
    req.user = req.user; // Already set by auth middleware
    await submissionController.list(req, res, next);
}));
export const submissionRouter = router;
