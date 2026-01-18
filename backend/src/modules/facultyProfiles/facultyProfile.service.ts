import { FacultyProfile } from "./facultyProfile.model.js";
import { NotFoundError } from "../../core/errors/NotFoundError.js";

/**
 * FACULTY PROFILE SERVICE
 * Handles business logic for faculty profile operations
 */

export interface FacultyProfileDTO {
  id: string;
  facultyCode: string;
  department: string;
  designation: string;
  email?: string;
}

export interface UpdateFacultyProfilePayload {
  designation?: string;
}

/**
 * Get faculty profile for logged-in faculty
 * 🔒 Security: Always filters by userId and isActive
 */
export async function getFacultyProfile(userId: string): Promise<FacultyProfileDTO> {
  const profile = await FacultyProfile.findOne({ userId, isActive: true })
    .populate("userId", "email")
    .lean();

  if (!profile) {
    throw new NotFoundError("Faculty profile not found");
  }

  // Map to clean DTO
  return {
    id: profile._id.toString(),
    facultyCode: profile.facultyCode,
    department: profile.department,
    designation: profile.designation,
    email: (profile.userId as any)?.email
  };
}

/**
 * Update faculty profile (limited fields only)
 * 🔒 Security: Only allows updating non-critical fields
 */
export async function updateFacultyProfile(
  userId: string,
  payload: UpdateFacultyProfilePayload
): Promise<FacultyProfileDTO> {
  const profile = await FacultyProfile.findOneAndUpdate(
    { userId, isActive: true },
    { $set: payload },
    { new: true, runValidators: true }
  )
    .populate("userId", "email")
    .lean();

  if (!profile) {
    throw new NotFoundError("Faculty profile not found");
  }

  // Map to clean DTO
  return {
    id: profile._id.toString(),
    facultyCode: profile.facultyCode,
    department: profile.department,
    designation: profile.designation,
    email: (profile.userId as any)?.email
  };
}

/**
 * List all faculty profiles (admin only)
 * 🔒 Security: Should only be called after admin role check
 */
export async function listFacultyProfiles(options: {
  department?: string;
  isActive?: boolean;
  limit?: number;
  skip?: number;
}): Promise<{ profiles: FacultyProfileDTO[]; total: number }> {
  const { department, isActive = true, limit = 50, skip = 0 } = options;

  const filter: any = { isActive };
  if (department) {
    filter.department = department;
  }

  const [profiles, total] = await Promise.all([
    FacultyProfile.find(filter)
      .populate("userId", "email")
      .limit(limit)
      .skip(skip)
      .lean(),
    FacultyProfile.countDocuments(filter)
  ]);

  const mappedProfiles = profiles.map((profile) => ({
    id: profile._id.toString(),
    facultyCode: profile.facultyCode,
    department: profile.department,
    designation: profile.designation,
    email: (profile.userId as any)?.email
  }));

  return {
    profiles: mappedProfiles,
    total
  };
}
