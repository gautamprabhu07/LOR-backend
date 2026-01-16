import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import { fileController } from "./file.controller.js";
import { auth } from "../../core/middleware/auth.js";
import { requireRole } from "../../core/middleware/requireRole.js";

const router = Router();

// ⚡ MULTER CONFIG
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword", // .doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOC, and DOCX allowed."));
    }
  }
});

// ⚡ RATE LIMITING
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per IP per 15 min
  message: {
    status: "error",
    message: "Too many file uploads. Please try again later."
  }
});

const downloadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 downloads per IP per 5 min
  message: {
    status: "error",
    message: "Too many download requests. Please try again later."
  }
});

/**
 * POST /api/files/upload
 * General file upload (for certificates, etc.)
 * 🔒 Student/Alumni only
 */
router.post(
  "/upload",
  auth,
  requireRole("student", "alumni"),
  uploadLimiter,
  multerUpload.single("file"),
  fileController.uploadFile
);

/**
 * POST /api/files/upload-draft/:submissionId
 * Upload draft LoR (student)
 * 🔒 Student/Alumni only
 */
router.post(
  "/upload-draft/:submissionId",
  auth,
  requireRole("student", "alumni"),
  uploadLimiter,
  multerUpload.single("file"),
  fileController.uploadDraft
);

/**
 * POST /api/files/upload-final/:submissionId
 * Upload final LoR (faculty)
 * 🔒 Faculty only
 */
router.post(
  "/upload-final/:submissionId",
  auth,
  requireRole("faculty"),
  uploadLimiter,
  multerUpload.single("file"),
  fileController.uploadFinal
);

/**
 * GET /api/files/:fileId/download
 * Download file
 * 🔒 Ownership validated in controller
 */
router.get(
  "/:fileId/download",
  auth,
  downloadLimiter,
  fileController.downloadFile
);

/**
 * GET /api/files/submission/:submissionId
 * List all files for a submission
 * 🔒 Ownership validated in controller
 */
router.get(
  "/submission/:submissionId",
  auth,
  fileController.listFiles
);

export { router as fileRouter };
