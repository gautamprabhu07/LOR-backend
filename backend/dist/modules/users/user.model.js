import { Schema, model } from "mongoose";
const userSchema = new Schema({
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
}, {
    timestamps: true
});
// Compound index for admin dashboards
userSchema.index({ role: 1, status: 1 });
export const User = model("User", userSchema);
