import { Schema, model } from "mongoose";
const facultyProfileSchema = new Schema({
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
}, {
    timestamps: true
});
export const FacultyProfile = model("FacultyProfile", facultyProfileSchema);
