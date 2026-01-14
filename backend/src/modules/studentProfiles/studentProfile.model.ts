import { Schema, model, Document, Types } from "mongoose";

export interface IStudentProfileDocument extends Document {
  userId: Types.ObjectId;
  registrationNumber: string;
  isAlumni: boolean;
  department: string;
  verificationStatus: "pending" | "verified" | "rejected";
  targetUniversities: {
    name: string;
    country: string;
  }[];
  isActive: boolean;
}

const targetUniversitySchema = new Schema({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true }
}, { _id: false });

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
      validate: [
        {
          validator: function (targets: any[]) {
            return targets.length <= 10;
          },
          message: "Maximum 10 target universities allowed"
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
