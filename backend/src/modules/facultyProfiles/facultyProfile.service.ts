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

export interface FacultyDirectoryDTO {
  id: string;
  facultyCode: string;
  department: string;
  designation: string;
  email?: string;
  displayName: string;
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

/**
 * List faculty directory (student/alumni)
 * 🔒 Security: Only returns active faculty, limited fields
 */
export async function listFacultyDirectory(options: {
  search?: string;
  department?: string;
  limit?: number;
  skip?: number;
}): Promise<{ profiles: FacultyDirectoryDTO[]; total: number }> {
  const { search, department, limit = 50, skip = 0 } = options;

  const filter: any = { isActive: true };
  if (department) {
    filter.department = department;
  }

  if (search) {
    const regex = new RegExp(search, "i");
    filter.$or = [
      { facultyCode: regex },
      { department: regex },
      { designation: regex }
    ];
  }

  const [profiles, total] = await Promise.all([
    FacultyProfile.find(filter)
      .populate("userId", "email")
      .limit(limit)
      .skip(skip)
      .lean(),
    FacultyProfile.countDocuments(filter)
  ]);

  const mappedProfiles = profiles
    .map((profile) => {
      const email = (profile.userId as any)?.email;
      const displayName = email
        ? email.split("@")[0]
        : `Faculty ${profile.facultyCode}`;

      return {
        id: profile._id.toString(),
        facultyCode: profile.facultyCode,
        department: profile.department,
        designation: profile.designation,
        email,
        displayName
      };
    })
    .filter((profile) => {
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        profile.displayName.toLowerCase().includes(term) ||
        profile.email?.toLowerCase().includes(term) ||
        profile.facultyCode.toLowerCase().includes(term) ||
        profile.department.toLowerCase().includes(term) ||
        profile.designation.toLowerCase().includes(term)
      );
    });

  return {
    profiles: mappedProfiles,
    total
  };
}
