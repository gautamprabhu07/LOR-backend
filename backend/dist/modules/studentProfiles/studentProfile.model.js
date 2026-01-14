import { Schema, model } from "mongoose";
const targetUniversitySchema = new Schema({
    name: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
}, { _id: false });
const studentProfileSchema = new Schema({
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
                validator: function (targets) {
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
}, {
    timestamps: true
});
export const StudentProfile = model("StudentProfile", studentProfileSchema);
