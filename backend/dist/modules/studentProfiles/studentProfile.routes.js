import { Router } from "express";
import { auth } from "../../core/middleware/auth.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import * as studentProfileController from "./studentProfile.controller.js";
const router = Router();
// All routes require authentication as student or alumni
router.use(auth, requireRole("student", "alumni"));
/**
 * GET /api/student/profile
 * Get complete student profile
 */
router.get("/", studentProfileController.getProfile);
/**
 * Employment endpoints
 * GET    /api/student/profile/employment
 * PATCH  /api/student/profile/employment
 */
router.get("/employment", studentProfileController.getEmployment);
router.patch("/employment", studentProfileController.updateEmployment);
/**
 * Target Universities endpoints
 * GET    /api/student/profile/targets
 * POST   /api/student/profile/targets
 * DELETE /api/student/profile/targets/:targetId
 */
router.get("/targets", studentProfileController.getTargetUniversities);
router.post("/targets", studentProfileController.addTargetUniversity);
router.delete("/targets/:targetId", studentProfileController.deleteTargetUniversity);
/**
 * Certificates endpoints
 * GET    /api/student/profile/certificates
 * POST   /api/student/profile/certificates
 * DELETE /api/student/profile/certificates/:certificateId
 */
router.get("/certificates", studentProfileController.getCertificates);
router.post("/certificates", studentProfileController.addCertificate);
router.delete("/certificates/:certificateId", studentProfileController.deleteCertificate);
export default router;
