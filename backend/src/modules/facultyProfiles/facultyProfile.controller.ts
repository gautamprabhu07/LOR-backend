import { Request, Response } from "express";
import { z } from "zod";
import * as facultyProfileService from "./facultyProfile.service.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * GET /api/faculty/profile
 * Get current faculty profile for logged-in faculty
 * 🔒 Security: Reads userId from req.user, never from body/query
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const profile = await facultyProfileService.getFacultyProfile(userId);

  res.json({
    status: "success",
    data: profile
  });
});

/**
 * PATCH /api/faculty/profile
 * Update limited fields of faculty profile
 * 🔒 Security: Only allows updating non-critical fields (designation)
 */
const updateProfileSchema = z.object({
  designation: z.string().trim().min(1).max(200).optional()
}).strict(); // Reject unknown fields

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const validated = updateProfileSchema.parse(req.body);

  // Only proceed if there's something to update
  if (Object.keys(validated).length === 0) {
    const profile = await facultyProfileService.getFacultyProfile(userId);
    return res.json({
      status: "success",
      data: profile
    });
  }

  const profile = await facultyProfileService.updateFacultyProfile(userId, validated);

  res.json({
    status: "success",
    data: profile
  });
});

/**
 * GET /api/faculty/profiles (admin only)
 * List all faculty profiles with filters and pagination
 * 🔒 Security: Should be mounted with requireRole("admin")
 */
const listProfilesSchema = z.object({
  department: z.string().optional(),
  isActive: z.string().transform((val) => val === "true").optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  skip: z.string().transform((val) => parseInt(val, 10)).optional()
});

export const listProfiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = listProfilesSchema.parse(req.query);

  const result = await facultyProfileService.listFacultyProfiles(validated);

  res.json({
    status: "success",
    data: result
  });
});
