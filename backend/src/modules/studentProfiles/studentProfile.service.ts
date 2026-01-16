import { Types } from "mongoose";
import { StudentProfile, IStudentProfileDocument } from "./studentProfile.model.js";
import { NotFoundError } from "../../core/errors/NotFoundError.js";
import { BadRequestError } from "../../core/errors/BadRequestError.js";
import { ForbiddenError } from "../../core/errors/ForbiddenError.js";
import { File } from "../files/file.model.js";

/**
 * Employment service methods
 */
export const getEmployment = async (userId: string) => {
  const profile = await StudentProfile.findOne({ 
    userId, 
    isActive: true 
  }).lean();

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  return profile.employment;
};

export const updateEmployment = async (
  userId: string,
  data: {
    status: "employed" | "studying" | "unemployed";
    company?: string;
    role?: string;
    university?: string;
    course?: string;
    remarks?: string;
  }
) => {
  // Validate conditional fields
  if (data.status === "employed") {
    if (!data.company || !data.role) {
      throw new BadRequestError("Company and role are required when employed");
    }
  }

  if (data.status === "studying") {
    if (!data.university || !data.course) {
      throw new BadRequestError("University and course are required when studying");
    }
  }

  const profile = await StudentProfile.findOneAndUpdate(
    { userId, isActive: true },
    { $set: { employment: data } },
    { new: true, runValidators: true }
  );

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  return profile.employment;
};

/**
 * Target Universities service methods
 */
export const getTargetUniversities = async (userId: string) => {
  const profile = await StudentProfile.findOne({ 
    userId, 
    isActive: true 
  }).lean();

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  return profile.targetUniversities || [];
};

export const addTargetUniversity = async (
  userId: string,
  data: {
    university: string;
    program: string;
    deadline: Date;
    purpose: string;
  }
) => {
  const profile = await StudentProfile.findOne({ userId, isActive: true });

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  // Check max limit
  if (profile.targetUniversities.length >= 5) {
    throw new BadRequestError("Maximum 5 target universities allowed");
  }

  profile.targetUniversities.push(data as typeof profile.targetUniversities[0]);
  await profile.save();

  return profile.targetUniversities[profile.targetUniversities.length - 1];
};

export const deleteTargetUniversity = async (
  userId: string,
  targetId: string
) => {
  const profile = await StudentProfile.findOne({ userId, isActive: true });

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  const initialLength = profile.targetUniversities.length;
  profile.targetUniversities = profile.targetUniversities.filter(
    (target) => target._id.toString() !== targetId
  );

  if (profile.targetUniversities.length === initialLength) {
    throw new NotFoundError("Target university not found");
  }

  await profile.save();
  return { message: "Target university deleted successfully" };
};

/**
 * Certificates service methods
 */
export const getCertificates = async (userId: string) => {
  const profile = await StudentProfile.findOne({ 
    userId, 
    isActive: true 
  })
    .populate("certificates.fileId", "originalName mimeType size uploadedAt")
    .lean();

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  return profile.certificates || [];
};

export const addCertificate = async (
  userId: string,
  data: {
    type: "GRE" | "GMAT" | "CAT" | "MAT" | "OTHER";
    fileId: string;
    comment?: string;
  }
) => {
  const profile = await StudentProfile.findOne({ userId, isActive: true });

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  // Check max limit
  if (profile.certificates.length >= 5) {
    throw new BadRequestError("Maximum 5 certificates allowed");
  }

  // Verify file exists and belongs to this user
  const file = await File.findOne({
    _id: data.fileId,
    studentId: profile._id
  });

  if (!file) {
    throw new ForbiddenError(
      "File not found or you don't have permission to access it"
    );
  }

  // Validate comment requirement for OTHER type
  if (data.type === "OTHER" && !data.comment) {
    throw new BadRequestError("Comment is required for certificate type OTHER");
  }

  profile.certificates.push({
    type: data.type,
    fileId: new Types.ObjectId(data.fileId),
    comment: data.comment
  } as typeof profile.certificates[0]);

  await profile.save();

  return profile.certificates[profile.certificates.length - 1];
};

export const deleteCertificate = async (
  userId: string,
  certificateId: string
) => {
  const profile = await StudentProfile.findOne({ userId, isActive: true });

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  const initialLength = profile.certificates.length;
  profile.certificates = profile.certificates.filter(
    (cert) => cert._id.toString() !== certificateId
  );

  if (profile.certificates.length === initialLength) {
    throw new NotFoundError("Certificate not found");
  }

  await profile.save();
  return { message: "Certificate deleted successfully" };
};

/**
 * Get full profile
 */
export const getStudentProfile = async (userId: string) => {
  const profile = await StudentProfile.findOne({ 
    userId, 
    isActive: true 
  })
    .populate("certificates.fileId", "originalName mimeType size uploadedAt")
    .lean();

  if (!profile) {
    throw new NotFoundError("Student profile not found");
  }

  return profile;
};
