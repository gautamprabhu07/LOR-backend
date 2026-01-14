import { Schema, model, Document, Types } from "mongoose";

export interface IFacultyProfileDocument extends Document {
  userId: Types.ObjectId;
  facultyCode: string;
  department: string;
  designation: string;
  isActive: boolean;
}

const facultyProfileSchema = new Schema<IFacultyProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    facultyCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      index: true
    },
    designation: {
      type: String,
      required: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const FacultyProfile = model<IFacultyProfileDocument>(
  "FacultyProfile",
  facultyProfileSchema
);
