import { Schema, model, Document, Types } from "mongoose";

export type SubmissionStatus =
  | "submitted"
  | "resubmission"
  | "approved"
  | "rejected"
  | "completed";

interface AuditEntry {
  at: Date;
  actorId: Types.ObjectId;
  fromStatus: SubmissionStatus | null;
  toStatus: SubmissionStatus;
  remark?: string;
}

export interface ISubmissionDocument extends Document {
  studentId: Types.ObjectId;
  facultyId: Types.ObjectId;
  status: SubmissionStatus;
  deadline: Date;
  universityName?: string;
  purpose?: string;
  isAlumni: boolean;
  currentVersion: number;
  facultyNotes?: string;
  auditLog: AuditEntry[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const auditEntrySchema = new Schema<AuditEntry>(
  {
    at: { type: Date, default: Date.now },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromStatus: {
      type: String,
      enum: ["submitted", "resubmission", "approved", "rejected", "completed", null],
      default: null
    },
    toStatus: {
      type: String,
      enum: ["submitted", "resubmission", "approved", "rejected", "completed"],
      required: true
    },
    remark: { type: String }
  },
  { _id: false }
);

const submissionSchema = new Schema<ISubmissionDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      required: true,
      index: true
    },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: "FacultyProfile",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["submitted", "resubmission", "approved", "rejected", "completed"],
      required: true,
      default: "submitted",
      index: true
    },
    deadline: {
      type: Date,
      required: true,
      index: true
    },
    universityName: {
      type: String,
      trim: true
    },
    purpose: {
      type: String,
      trim: true
    },
    isAlumni: {
      type: Boolean,
      default: false
    },
    currentVersion: {
      type: Number,
      min: 1,
      default: 1
    },
    facultyNotes: {
      type: String
    },
    auditLog: {
      type: [auditEntrySchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// 🔥 PARTIAL UNIQUE CONSTRAINT (CRITICAL BUSINESS RULE)
// Prevents duplicate active submissions for same student + faculty
submissionSchema.index(
  { studentId: 1, facultyId: 1 },
  { 
    unique: true, 
    partialFilterExpression: { isActive: { $eq: true } } 
  }
);

// Critical indexes for dashboards + jobs
submissionSchema.index({ facultyId: 1, status: 1 });
submissionSchema.index({ studentId: 1, status: 1 });
submissionSchema.index({ status: 1, deadline: 1 });
submissionSchema.index({ createdAt: -1 });

export const Submission = model<ISubmissionDocument>("Submission", submissionSchema);
