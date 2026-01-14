import { Schema, model, Document, Types, CallbackError } from "mongoose";

export type FileType = "draft" | "final" | "certificate";

export interface IFileDocument extends Document {
  submissionId?: Types.ObjectId; // optional for certificates
  studentId?: Types.ObjectId;   // optional for submission files
  type: FileType;
  version: number;
  uploadedBy: Types.ObjectId;
  storageKey: string; // S3 key / local path
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

const fileSchema = new Schema<IFileDocument>(
  {
    submissionId: {
      type: Schema.Types.ObjectId,
      ref: "Submission",
      index: true
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProfile",
      index: true
    },
    type: {
      type: String,
      enum: ["draft", "final", "certificate"],
      required: true,
      index: true
    },
    version: {
      type: Number,
      min: 1,
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    storageKey: {
      type: String,
      required: true,
      unique: true
    },
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // files don't change after upload
  }
);

// 🔥 SCHEMA-LEVEL VALIDATION: Prevent orphaned files
fileSchema.pre("validate", function () {
  const doc = this as IFileDocument;
  
  // Ensure file belongs to either submission OR student (not both empty)
  if (!doc.submissionId && !doc.studentId) {
    throw new Error("File must belong to submission or student");
  }
  
  // Optional: Warn if both are set (business rule)
  if (doc.submissionId && doc.studentId) {
    console.warn("File has both submissionId and studentId - using submissionId");
  }
});

// Composite indexes for fast retrieval
fileSchema.index({ submissionId: 1, type: 1, version: -1 }); // latest version per submission
fileSchema.index({ studentId: 1, type: 1 });

export const File = model<IFileDocument>("File", fileSchema);
