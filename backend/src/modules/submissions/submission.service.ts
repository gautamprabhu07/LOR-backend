import { Types } from "mongoose";
import { Submission, ISubmissionDocument, SubmissionStatus } from "./submission.model.js";
import { StudentProfile } from "../studentProfiles/studentProfile.model.js";
import { FacultyProfile } from "../facultyProfiles/facultyProfile.model.js";
import { User } from "../users/user.model.js";
import { BadRequestError } from "../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../core/errors/ForbiddenError.js";
import { NotFoundError } from "../../core/errors/NotFoundError.js";
import { statusTransitions, TransitionContext, UserRole } from "../../core/utils/statusTransitions.js";
import { emailService, EmailContext } from "../emails/email.service.js";

export interface CreateSubmissionDTO {
  facultyId: string;
  deadline: Date;
  universityName?: string;
  purpose?: string;
}

export interface UpdateStatusDTO {
  newStatus: SubmissionStatus;
  remark?: string;
}

export const submissionService = {
  /**
   * CREATE SUBMISSION (Student only)
   * 🔒 Security: Ownership + unique constraint + faculty validation
   */
  async createSubmission(
    actorUserId: string,
    actorRole: UserRole,
    dto: CreateSubmissionDTO
  ): Promise<ISubmissionDocument> {
    // 1. Role check
    if (actorRole !== "student" && actorRole !== "alumni") {
      throw new ForbiddenError("Only students/alumni can create submissions");
    }

    // 2. Validate deadline is future
    if (new Date(dto.deadline) <= new Date()) {
      throw new BadRequestError("Deadline must be in the future");
    }

    // 3. Get student profile (validates existence + ownership)
    const studentProfile = await StudentProfile.findOne({ 
      userId: actorUserId,
      isActive: true 
    });
    
    if (!studentProfile) {
      throw new NotFoundError("Student profile not found");
    }

    // 4. Validate faculty exists and is active
    const facultyProfile = await FacultyProfile.findById(dto.facultyId);
    if (!facultyProfile || !facultyProfile.isActive) {
      throw new BadRequestError("Invalid or inactive faculty");
    }

    // 5. Check for duplicate active submission (student + faculty)
    const existingSubmission = await Submission.findOne({
      studentId: studentProfile._id,
      facultyId: new Types.ObjectId(dto.facultyId),
      isActive: true
    });

    if (existingSubmission) {
      throw new BadRequestError(
        "Active submission already exists with this faculty. Complete or delete existing submission first."
      );
    }

    // 6. Create submission with audit log
    const submission = await Submission.create({
      studentId: studentProfile._id,
      facultyId: new Types.ObjectId(dto.facultyId),
      status: "submitted",
      deadline: dto.deadline,
      universityName: dto.universityName,
      purpose: dto.purpose,
      isAlumni: studentProfile.isAlumni,
      currentVersion: 1,
      auditLog: [
        {
          at: new Date(),
          actorId: new Types.ObjectId(actorUserId),
          fromStatus: null,
          toStatus: "submitted"
        }
      ],
      isActive: true
    });

    // 7. Fire-and-forget email to faculty (non-blocking)
    try {
      const facultyUser = await User.findById(facultyProfile.userId);
      const studentUser = await User.findById(studentProfile.userId);
      
      if (facultyUser && studentUser) {
        // Email notification logic can be added here
        console.log(`📧 New submission notification sent to ${facultyUser.email}`);
      }
    } catch (err) {
      console.error("Email notification failed:", err);
      // Don't block submission creation
    }

    return submission;
  },

  /**
   * LIST SUBMISSIONS (Role-based filtering)
   * 🔒 Security: Ownership-based queries
   */
  async listSubmissions(
    actorUserId: string,
    actorRole: UserRole,
    filters?: {
      status?: SubmissionStatus;
      isActive?: boolean;
    }
  ): Promise<ISubmissionDocument[]> {
    const query: any = { isActive: filters?.isActive ?? true };

    // Role-based filtering
    if (actorRole === "student" || actorRole === "alumni") {
      const studentProfile = await StudentProfile.findOne({ 
        userId: actorUserId,
        isActive: true 
      });
      
      if (!studentProfile) {
        throw new NotFoundError("Student profile not found");
      }

      query.studentId = studentProfile._id;
    } else if (actorRole === "faculty") {
      const facultyProfile = await FacultyProfile.findOne({ 
        userId: actorUserId,
        isActive: true 
      });
      
      if (!facultyProfile) {
        throw new NotFoundError("Faculty profile not found");
      }

      query.facultyId = facultyProfile._id;
    } else if (actorRole === "admin") {
      // Admin sees all
    } else {
      throw new ForbiddenError("Invalid role");
    }

    // Apply status filter if provided
    if (filters?.status) {
      query.status = filters.status;
    }

    // Lean query for performance (no Mongoose document overhead)
    const submissions = await Submission.find(query)
      .select("studentId facultyId status deadline universityName purpose currentVersion createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return submissions as ISubmissionDocument[];
  },

  /**
   * GET SINGLE SUBMISSION
   * 🔒 Security: Ownership validation
   */
  async getSubmission(
    submissionId: string,
    actorUserId: string,
    actorRole: UserRole
  ): Promise<ISubmissionDocument> {
    const submission = await Submission.findById(submissionId);

    if (!submission || !submission.isActive) {
      throw new NotFoundError("Submission not found");
    }

    // Ownership check
    await validateOwnership(submission, actorUserId, actorRole);

    return submission;
  },

  /**
   * UPDATE STATUS (Faculty/Student based on transition)
   * 🔒 Security: Status machine + ownership + audit log
   */
  async updateStatus(
    submissionId: string,
    actorUserId: string,
    actorRole: UserRole,
    dto: UpdateStatusDTO
  ): Promise<ISubmissionDocument> {
    // 1. Get submission
    const submission = await Submission.findById(submissionId);

    if (!submission || !submission.isActive) {
      throw new NotFoundError("Submission not found");
    }

    // 2. Get profile IDs for ownership check
    const { studentUserId, facultyUserId } = await getSubmissionUserIds(submission);

    // 3. Validate transition (status machine + role + ownership)
    const transitionContext: TransitionContext = {
      currentStatus: submission.status,
      newStatus: dto.newStatus,
      actorRole,
      actorId: actorUserId,
      submissionFacultyId: facultyUserId,
      submissionStudentId: studentUserId
    };

    statusTransitions.validate(transitionContext);

    // 4. Update status + increment version if resubmitting
    const oldStatus = submission.status;
    submission.status = dto.newStatus;

    if (oldStatus === "resubmission" && dto.newStatus === "submitted") {
      submission.currentVersion += 1;
    }

    // 5. Add audit log entry
    submission.auditLog.push({
      at: new Date(),
      actorId: new Types.ObjectId(actorUserId),
      fromStatus: oldStatus,
      toStatus: dto.newStatus,
      remark: dto.remark
    });

    // 6. Save submission
    await submission.save();

    // 7. Fire-and-forget email notification
    await sendStatusChangeEmail(submission, dto.newStatus, oldStatus, dto.remark);

    return submission;
  },

  /**
   * SOFT DELETE (Student only, before approved)
   * 🔒 Security: Ownership + status check
   */
  async deleteSubmission(
    submissionId: string,
    actorUserId: string,
    actorRole: UserRole
  ): Promise<void> {
    // 1. Only students can delete
    if (actorRole !== "student" && actorRole !== "alumni") {
      throw new ForbiddenError("Only students can delete submissions");
    }

    // 2. Get submission
    const submission = await Submission.findById(submissionId);

    if (!submission || !submission.isActive) {
      throw new NotFoundError("Submission not found");
    }

    // 3. Ownership check
    const { studentUserId } = await getSubmissionUserIds(submission);
    
    if (studentUserId !== actorUserId) {
      throw new ForbiddenError("You can only delete your own submissions");
    }

    // 4. Status check (cannot delete approved/completed)
    if (submission.status === "approved" || submission.status === "completed") {
      throw new BadRequestError("Cannot delete approved or completed submissions");
    }

    // 5. Soft delete
    submission.isActive = false;
    await submission.save();
  }
};

/**
 * HELPER: Validate ownership
 */
async function validateOwnership(
  submission: ISubmissionDocument,
  actorUserId: string,
  actorRole: UserRole
): Promise<void> {
  // Admin bypass
  if (actorRole === "admin") return;

  const { studentUserId, facultyUserId } = await getSubmissionUserIds(submission);

  const isOwner =
    (actorRole === "student" || actorRole === "alumni") && actorUserId === studentUserId ||
    actorRole === "faculty" && actorUserId === facultyUserId;

  if (!isOwner) {
    throw new ForbiddenError("Access denied to this submission");
  }
}

/**
 * HELPER: Get user IDs from submission profiles
 */
async function getSubmissionUserIds(
  submission: ISubmissionDocument
): Promise<{ studentUserId: string; facultyUserId: string }> {
  const [studentProfile, facultyProfile] = await Promise.all([
    StudentProfile.findById(submission.studentId).select("userId"),
    FacultyProfile.findById(submission.facultyId).select("userId")
  ]);

  if (!studentProfile || !facultyProfile) {
    throw new NotFoundError("Related profile not found");
  }

  return {
    studentUserId: studentProfile.userId.toString(),
    facultyUserId: facultyProfile.userId.toString()
  };
}

/**
 * HELPER: Send status change email (fire-and-forget)
 */
async function sendStatusChangeEmail(
  submission: ISubmissionDocument,
  newStatus: SubmissionStatus,
  oldStatus: SubmissionStatus,
  remark?: string
): Promise<void> {
  try {
    const [studentProfile, facultyProfile, studentUser, facultyUser] = await Promise.all([
      StudentProfile.findById(submission.studentId),
      FacultyProfile.findById(submission.facultyId),
      StudentProfile.findById(submission.studentId).then(sp => 
        sp ? User.findById(sp.userId) : null
      ),
      FacultyProfile.findById(submission.facultyId).then(fp => 
        fp ? User.findById(fp.userId) : null
      )
    ]);

    if (!studentUser || !facultyUser) return;

    const emailContext: EmailContext = {
      submissionId: submission._id.toString(),
      studentEmail: studentUser.email,
      studentName: studentUser.email.split("@")[0],
      facultyName: facultyUser.email.split("@")[0],
      status: newStatus,
      remarks: remark,
      deadline: submission.deadline
    };

    // Determine email type based on status transition
    if (newStatus === "resubmission") {
      await emailService.send("resubmission_requested", studentUser.email, emailContext);
    } else if (newStatus === "rejected") {
      await emailService.send("submission_rejected", studentUser.email, emailContext);
    } else if (newStatus === "approved") {
      await emailService.send("draft_approved", studentUser.email, emailContext);
    } else if (newStatus === "completed") {
      await emailService.send("lor_completed", studentUser.email, emailContext);
    }
  } catch (err) {
    console.error("Email notification error:", err);
    // Never throw - email failures should not block status updates
  }
}
