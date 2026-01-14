import { Schema, model, Document } from "mongoose";

export type UserRole = "student" | "alumni" | "faculty" | "admin";

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  status: "active" | "inactive" | "pending";
  lastLoginAt?: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false // never expose password in queries
    },
    role: {
      type: String,
      enum: ["student", "alumni", "faculty", "admin"],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
      index: true
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Compound index for admin dashboards
userSchema.index({ role: 1, status: 1 });

export const User = model<IUserDocument>("User", userSchema);
