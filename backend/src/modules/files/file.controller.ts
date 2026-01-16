import { Request, Response } from "express";
import { Types } from "mongoose";
import { File } from "./file.model.js";
import { Submission } from "../submissions/submission.model.js";
import { StudentProfile } from "../studentProfiles/studentProfile.model.js";
import { FacultyProfile } from "../facultyProfiles/facultyProfile.model.js";
import { storageService } from "./storage.service.js";
import { BadRequestError } from "../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../core/errors/NotFoundError.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { submissionService } from "../submissions/submission.service.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
  file?: Express.Multer.File;
}

export const fileController = {
  /**
   * POST /api/files/upload
   * General file upload (for certificates, etc.)
   * 🔒 Student/Alumni only
   */
  uploadFile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const actorUserId = req.user!.id;

    // 1. Validate file presence
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    // 2. Get student profile to ensure user is student/alumni
    const studentProfile = await StudentProfile.findOne({
      userId: actorUserId,
      isActive: true
    });

    if (!studentProfile) {
      throw new NotFoundError("Student profile not found");
    }

    // 3. Save file to storage (using drafts folder for now, could create separate folder)
    const { storageKey, size } = await storageService.saveDraftFile(
      req.file.buffer,
      studentProfile._id.toString(),
      "general", // Not submission-specific
      req.file.originalname
    );

    // 4. Create File document without submissionId
    const fileDoc = await File.create({
      studentId: studentProfile._id,
      type: "certificate",
      version: 1,
      uploadedBy: new Types.ObjectId(actorUserId),
      storageKey,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size
    });

    res.status(201).json({
      status: "success",
      data: {
        fileId: fileDoc._id,
        originalName: fileDoc.originalName,
        mimeType: fileDoc.mimeType,
        size: fileDoc.size,
        uploadedAt: fileDoc.createdAt
      }
    });
  }),

  /**
   * POST /api/files/upload-draft/:submissionId
   * 🔒 Student/Alumni only
   */
  uploadDraft: asyncHandler(async (req: AuthRequest, res: Response) => {
    const submissionId = req.params.submissionId as string;
    const actorUserId = req.user!.id;
    const actorRole = req.user!.role as "student" | "alumni";

    // 1. Validate file presence
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    // 2. Get submission
    const submission = await Submission.findById(submissionId);
    if (!submission || !submission.isActive) {
      throw new NotFoundError("Submission not found");
    }

    // 3. Get student profile & validate ownership
    const studentProfile = await StudentProfile.findOne({
      userId: actorUserId,
      isActive: true
    });

    if (!studentProfile) {
      throw new NotFoundError("Student profile not found");
    }

    if (submission.studentId.toString() !== studentProfile._id.toString()) {
      throw new ForbiddenError("You can only upload files to your own submissions");
    }

    // 4. Validate status (can only upload draft in submitted/resubmission states)
    if (!["submitted", "resubmission"].includes(submission.status)) {
      throw new BadRequestError(
        `Cannot upload draft in status: ${submission.status}. Only allowed in 'submitted' or 'resubmission' status.`
      );
    }

    // 5. Determine next version for drafts
    const existingDrafts = await File.find({
      submissionId: new Types.ObjectId(submissionId),
      type: "draft"
    }).sort({ version: -1 }).limit(1);

    const nextVersion = existingDrafts.length > 0 
      ? existingDrafts[0].version + 1 
      : 1;

    // 6. Save file to storage
    const { storageKey, size } = await storageService.saveDraftFile(
      req.file.buffer,
      studentProfile._id.toString(),
      submissionId,
      req.file.originalname
    );

    // 7. Create File document
    const fileDoc = await File.create({
      submissionId: new Types.ObjectId(submissionId),
      type: "draft",
      version: nextVersion,
      uploadedBy: new Types.ObjectId(actorUserId),
      storageKey,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size
    });

    // 8. Update submission's current version
    submission.currentVersion = nextVersion;
    await submission.save();

    res.status(201).json({
      status: "success",
      data: {
        fileId: fileDoc._id,
        version: nextVersion,
        originalName: fileDoc.originalName,
        size: fileDoc.size,
        uploadedAt: fileDoc.createdAt
      }
    });
  }),

  /**
   * POST /api/files/upload-final/:submissionId
   * 🔒 Faculty only
   */
  uploadFinal: asyncHandler(async (req: AuthRequest, res: Response) => {
    const submissionId = req.params.submissionId as string;
    const actorUserId = req.user!.id;
    const actorRole = req.user!.role;

    // 1. Validate file presence
    if (!req.file) {
      throw new BadRequestError("No file uploaded");
    }

    // 2. Get submission
    const submission = await Submission.findById(submissionId);
    if (!submission || !submission.isActive) {
      throw new NotFoundError("Submission not found");
    }

    // 3. Get faculty profile & validate ownership
    const facultyProfile = await FacultyProfile.findOne({
      userId: actorUserId,
      isActive: true
    });

    if (!facultyProfile) {
      throw new NotFoundError("Faculty profile not found");
    }

    if (submission.facultyId.toString() !== facultyProfile._id.toString()) {
      throw new ForbiddenError("You can only upload final files to your assigned submissions");
    }

    // 4. Validate status (must be approved)
    if (submission.status !== "approved") {
      throw new BadRequestError(
        `Cannot upload final LoR. Submission must be in 'approved' status, currently: ${submission.status}`
      );
    }

    // 5. Check if final already exists (only one final allowed)
    const existingFinal = await File.findOne({
      submissionId: new Types.ObjectId(submissionId),
      type: "final"
    });

    if (existingFinal) {
      throw new BadRequestError(
        "Final LoR already uploaded for this submission. Delete existing one first if you need to replace it."
      );
    }

    // 6. Save file to storage
    const { storageKey, size } = await storageService.saveFinalFile(
      req.file.buffer,
      facultyProfile._id.toString(),
      submissionId,
      req.file.originalname
    );

    // 7. Create File document
    const fileDoc = await File.create({
      submissionId: new Types.ObjectId(submissionId),
      type: "final",
      version: 1, // Finals are always version 1
      uploadedBy: new Types.ObjectId(actorUserId),
      storageKey,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size
    });

    // 8. Update submission status to 'completed'
    await submissionService.updateStatus(
      submissionId,
      actorUserId,
      actorRole as "faculty",
      {
        newStatus: "completed",
        remark: "Final LoR uploaded"
      }
    );

    res.status(201).json({
      status: "success",
      data: {
        fileId: fileDoc._id,
        originalName: fileDoc.originalName,
        size: fileDoc.size,
        uploadedAt: fileDoc.createdAt
      }
    });
  }),

  /**
   * GET /api/files/:fileId/download
   * 🔒 Ownership validated (student, assigned faculty, or admin)
   */
  downloadFile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const fileId = req.params.fileId as string;
    const actorUserId = req.user!.id;
    const actorRole = req.user!.role;

    // 1. Get file
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) {
      throw new NotFoundError("File not found");
    }

    // 2. Get related submission
    if (!fileDoc.submissionId) {
      throw new NotFoundError("File has no associated submission");
    }

    const submission = await Submission.findById(fileDoc.submissionId);
    if (!submission || !submission.isActive) {
      throw new NotFoundError("Associated submission not found");
    }

    // 3. Validate ownership
    const [studentProfile, facultyProfile] = await Promise.all([
      StudentProfile.findById(submission.studentId).select("userId"),
      FacultyProfile.findById(submission.facultyId).select("userId")
    ]);

    if (!studentProfile || !facultyProfile) {
      throw new NotFoundError("Related profile not found");
    }

    const studentUserId = studentProfile.userId.toString();
    const facultyUserId = facultyProfile.userId.toString();

    const isOwner =
      actorRole === "admin" ||
      (actorRole === "student" || actorRole === "alumni") && actorUserId === studentUserId ||
      actorRole === "faculty" && actorUserId === facultyUserId;

    if (!isOwner) {
      throw new ForbiddenError("Access denied to this file");
    }

    // 4. Stream file from storage
    const fileStream = storageService.getFileStream(fileDoc.storageKey);

    // 5. Set headers for download
    res.setHeader("Content-Type", fileDoc.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileDoc.originalName)}"`
    );
    res.setHeader("Content-Length", fileDoc.size.toString());

    // 6. Pipe stream to response
    fileStream.pipe(res);

    // Optional: Log download for audit
    console.log(`📥 File downloaded: ${fileDoc._id} by user ${actorUserId}`);
  }),

  /**
   * GET /api/files/submission/:submissionId
   * List all files for a submission
   * 🔒 Ownership validated
   */
  listFiles: asyncHandler(async (req: AuthRequest, res: Response) => {
    const submissionId = req.params.submissionId as string;
    const actorUserId = req.user!.id;
    const actorRole = req.user!.role;

    // 1. Get submission
    const submission = await Submission.findById(submissionId);
    if (!submission || !submission.isActive) {
      throw new NotFoundError("Submission not found");
    }

    // 2. Validate ownership
    const [studentProfile, facultyProfile] = await Promise.all([
      StudentProfile.findById(submission.studentId).select("userId"),
      FacultyProfile.findById(submission.facultyId).select("userId")
    ]);

    if (!studentProfile || !facultyProfile) {
      throw new NotFoundError("Related profile not found");
    }

    const studentUserId = studentProfile.userId.toString();
    const facultyUserId = facultyProfile.userId.toString();

    const isOwner =
      actorRole === "admin" ||
      (actorRole === "student" || actorRole === "alumni") && actorUserId === studentUserId ||
      actorRole === "faculty" && actorUserId === facultyUserId;

    if (!isOwner) {
      throw new ForbiddenError("Access denied to this submission's files");
    }

    // 3. Get all files for submission
    const files = await File.find({
      submissionId: new Types.ObjectId(submissionId)
    })
    .select("type version originalName mimeType size createdAt")
    .sort({ type: 1, version: -1 })
    .lean();

    res.status(200).json({
      status: "success",
      data: files
    });
  })
};
