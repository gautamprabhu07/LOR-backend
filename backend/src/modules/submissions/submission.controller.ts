import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { submissionService } from "./submission.service.js";
import { UserRole, SubmissionStatus } from "../../core/utils/statusTransitions.js";

// Extend Request to include authenticated user
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

// ✅ INPUT VALIDATION SCHEMAS (Zod)

const createSubmissionSchema = z.object({
  facultyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid faculty ID format"),
  deadline: z.string().datetime("Invalid deadline format"),
  universityName: z.string().min(1).max(200).optional(),
  purpose: z.string().min(1).max(500).optional()
});

const updateStatusSchema = z.object({
  newStatus: z.enum(["submitted", "resubmission", "approved", "rejected", "completed"]),
  remark: z.string().min(1).max(1000).optional()
});

const listSubmissionsQuerySchema = z.object({
  status: z.enum(["submitted", "resubmission", "approved", "rejected", "completed"]).optional(),
  isActive: z.enum(["true", "false"]).optional()
});

export const submissionController = {
  /**
   * POST /api/submissions
   * Create new LoR submission (Student/Alumni only)
   */
  create: asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Auth check
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
      return;
    }

    // 2. Input validation
    const dto = createSubmissionSchema.parse(req.body);

    // 3. Service call
    const submission = await submissionService.createSubmission(
      req.user.id,
      req.user.role,
      {
        facultyId: dto.facultyId,
        deadline: new Date(dto.deadline),
        universityName: dto.universityName,
        purpose: dto.purpose
      }
    );

    // 4. Response
    res.status(201).json({
      status: "success",
      data: {
        submission: {
          id: submission._id,
          facultyId: submission.facultyId,
          status: submission.status,
          deadline: submission.deadline,
          universityName: submission.universityName,
          purpose: submission.purpose,
          currentVersion: submission.currentVersion,
          createdAt: submission.createdAt
        }
      }
    });
  }),

  /**
   * GET /api/submissions
   * List submissions (role-based filtering)
   */
  list: asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Auth check
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
      return;
    }

    // 2. Query validation
    const query = listSubmissionsQuerySchema.parse(req.query);

    // 3. Service call
    const submissions = await submissionService.listSubmissions(
      req.user.id,
      req.user.role,
      {
        status: query.status as SubmissionStatus | undefined,
        isActive: query.isActive === "false" ? false : true
      }
    );

    // 4. Response
    res.status(200).json({
      status: "success",
      data: {
        submissions: submissions.map(s => ({
          id: s._id,
          studentId: s.studentId,
          facultyId: s.facultyId,
          status: s.status,
          deadline: s.deadline,
          universityName: s.universityName,
          purpose: s.purpose,
          currentVersion: s.currentVersion,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt
        })),
        count: submissions.length
      }
    });
  }),

  /**
   * GET /api/submissions/:id
   * Get single submission with full details
   */
  getById: asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Auth check
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
      return;
    }

    // 2. Service call (with ownership check)
    const submission = await submissionService.getSubmission(
      String(req.params.id),
      req.user.id,
      req.user.role
    );

    // 3. Response
    res.status(200).json({
      status: "success",
      data: {
        submission: {
          id: submission._id,
          studentId: submission.studentId,
          facultyId: submission.facultyId,
          status: submission.status,
          deadline: submission.deadline,
          universityName: submission.universityName,
          purpose: submission.purpose,
          currentVersion: submission.currentVersion,
          isAlumni: submission.isAlumni,
          facultyNotes: submission.facultyNotes,
          auditLog: submission.auditLog,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt
        }
      }
    });
  }),

  /**
   * POST /api/submissions/:id/status
   * Update submission status (Faculty/Student based on transition)
   */
  updateStatus: asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Auth check
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
      return;
    }

    // 2. Input validation
    const dto = updateStatusSchema.parse(req.body);

    // 3. Service call (validates transition + ownership)
    const submission = await submissionService.updateStatus(
      String(req.params.id),
      req.user.id,
      req.user.role,
      dto
    );

    // 4. Response
    res.status(200).json({
      status: "success",
      data: {
        submission: {
          id: submission._id,
          status: submission.status,
          currentVersion: submission.currentVersion,
          auditLog: submission.auditLog,
          updatedAt: submission.updatedAt
        }
      },
      message: `Status updated to ${dto.newStatus}`
    });
  }),

  /**
   * DELETE /api/submissions/:id
   * Soft delete submission (Student only, before approved)
   */
  delete: asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Auth check
    if (!req.user) {
      res.status(401).json({
        status: "error",
        message: "Unauthorized"
      });
      return;
    }

    // 2. Service call
    await submissionService.deleteSubmission(
      String(req.params.id),
      req.user.id,
      req.user.role
    );

    // 3. Response
    res.status(200).json({
      status: "success",
      message: "Submission deleted successfully"
    });
  })
};
