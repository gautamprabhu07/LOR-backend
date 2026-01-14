import { BadRequestError } from "../errors/BadRequestError.js";

export type SubmissionStatus =
  | "submitted"
  | "resubmission"
  | "approved"
  | "rejected"
  | "completed";

export type UserRole = "student" | "alumni" | "faculty" | "admin";

export interface TransitionContext {
  currentStatus: SubmissionStatus;
  newStatus: SubmissionStatus;
  actorRole: UserRole;
  actorId: string;
  submissionFacultyId: string;
  submissionStudentId: string;
}

export const statusTransitions = {
  /**
   * Single source of truth for ALL status transitions
   */
  allowedTransitions: {
    submitted: ["resubmission", "approved", "rejected"],
    resubmission: ["submitted"],
    approved: ["completed"],
    rejected: [],
    completed: []
  } as Record<SubmissionStatus, SubmissionStatus[]>,

  /**
   * Role-aware transition validation
   */
  validate: (ctx: TransitionContext): void => {
    const { currentStatus, newStatus, actorRole, actorId, submissionFacultyId, submissionStudentId } = ctx;

    // ✅ FIXED #1: FAIL-FAST IMMUTABILITY CHECK (FIRST)
    if (currentStatus === "completed" || currentStatus === "rejected") {
      throw new BadRequestError("Completed/rejected submissions are immutable");
    }

    // 2. Basic status transition check
    if (!statusTransitions.allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestError(
        `Invalid transition: ${currentStatus} → ${newStatus}`
      );
    }

    // 3. Role-based ownership rules
    switch (actorRole) {
      case "student":
      case "alumni":
        // Students can ONLY resubmit from resubmission → submitted
        if (actorId !== submissionStudentId) {
          throw new BadRequestError("Students can only manage their own submissions");
        }
        if (currentStatus !== "resubmission" || newStatus !== "submitted") {
          throw new BadRequestError("Students can only resubmit revised drafts");
        }
        break;

      case "faculty":
        // Faculty can only act on their assigned submissions
        if (actorId !== submissionFacultyId) {
          throw new BadRequestError("Faculty can only manage assigned submissions");
        }
        break;

      case "admin":
        // Admin can do anything (override)
        break;

      default:
        throw new BadRequestError("Invalid role");
    }
  },

  /**
   * Generate audit log entry
   */
  createAuditEntry: (
    ctx: TransitionContext
  ): {
    at: Date;
    actorId: string;
    fromStatus: SubmissionStatus | null;
    toStatus: SubmissionStatus;
  } => ({
    at: new Date(),
    actorId: ctx.actorId,
    fromStatus: ctx.currentStatus,
    toStatus: ctx.newStatus
  })
};
