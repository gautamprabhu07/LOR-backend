import { Schema, model, Document, Types } from "mongoose";

export interface IStudentProfileDocument extends Document {
  userId: Types.ObjectId;
  registrationNumber: string;
  isAlumni: boolean;
  department: string;
  verificationStatus: "pending" | "verified" | "rejected";
  targetUniversities: {
    _id: Types.ObjectId;
    university: string;
    program: string;
    deadline: Date;
    purpose: string;
  }[];
  employment: {
    status: "employed" | "studying" | "unemployed";
    company?: string;
    role?: string;
    university?: string;
    course?: string;
    remarks?: string;
  };
  certificates: {
    _id: Types.ObjectId;
    type: "GRE" | "GMAT" | "CAT" | "MAT" | "OTHER";
    fileId: Types.ObjectId;
    comment?: string;
  }[];
  isActive: boolean;
}

const targetUniversitySchema = new Schema({
  university: { type: String, required: true, trim: true },
  program: { type: String, required: true, trim: true },
  deadline: { type: Date, required: true },
  purpose: { type: String, required: true, trim: true }
}, { _id: true });

const employmentSchema = new Schema({
  status: { 
    type: String, 
    enum: ["employed", "studying", "unemployed"], 
    required: true 
  },
  company: { type: String, trim: true },
  role: { type: String, trim: true },
  university: { type: String, trim: true },
  course: { type: String, trim: true },
  remarks: { type: String, trim: true }
}, { _id: false });

const certificateSchema = new Schema({
  type: { 
    type: String, 
    enum: ["GRE", "GMAT", "CAT", "MAT", "OTHER"], 
    required: true 
  },
  fileId: { 
    type: Schema.Types.ObjectId, 
    ref: "File", 
    required: true 
  },
  comment: { type: String, trim: true }
}, { _id: true });

const studentProfileSchema = new Schema<IStudentProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    isAlumni: {
      type: Boolean,
      default: false,
      index: true
    },
    department: {
      type: String,
      required: true,
      index: true
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      index: true
    },
    targetUniversities: {
      type: [targetUniversitySchema],
      default: [],
      validate: [
        {
          validator: function (targets: unknown[]) {
            return targets.length <= 5;
          },
          message: "Maximum 5 target universities allowed"
        }
      ]
    },
    employment: {
      type: employmentSchema,
      default: () => ({ status: "studying" })
    },
    certificates: {
      type: [certificateSchema],
      default: [],
      validate: [
        {
          validator: function (certs: unknown[]) {
            return certs.length <= 5;
          },
          message: "Maximum 5 certificates allowed"
        }
      ]
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

export const StudentProfile = model<IStudentProfileDocument>(
  "StudentProfile",
  studentProfileSchema
);
