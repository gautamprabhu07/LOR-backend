import { Request, Response } from "express";
import { z } from "zod";
import * as studentProfileService from "./studentProfile.service.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

/**
 * GET /api/student/profile
 * Get complete student profile
 */
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const profile = await studentProfileService.getStudentProfile(userId);

  res.json({
    status: "success",
    data: profile
  });
});

/**
 * Employment endpoints
 */

const updateEmploymentSchema = z.object({
  status: z.enum(["employed", "studying", "unemployed"]),
  company: z.string().trim().min(1).max(200).optional(),
  role: z.string().trim().min(1).max(200).optional(),
  university: z.string().trim().min(1).max(200).optional(),
  course: z.string().trim().min(1).max(200).optional(),
  remarks: z.string().trim().max(500).optional()
});

export const getEmployment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const employment = await studentProfileService.getEmployment(userId);

  res.json({
    status: "success",
    data: employment
  });
});

export const updateEmployment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const validated = updateEmploymentSchema.parse(req.body);

  const employment = await studentProfileService.updateEmployment(userId, validated);

  res.json({
    status: "success",
    data: employment
  });
});

/**
 * Target Universities endpoints
 */

const addTargetUniversitySchema = z.object({
  university: z.string().trim().min(1).max(200),
  program: z.string().trim().min(1).max(200),
  deadline: z.string().datetime().or(z.date()).transform((val) => new Date(val)),
  purpose: z.string().trim().min(1).max(500)
});

export const getTargetUniversities = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const targets = await studentProfileService.getTargetUniversities(userId);

    res.json({
      status: "success",
      data: targets
    });
  }
);

export const addTargetUniversity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const validated = addTargetUniversitySchema.parse(req.body);

    const target = await studentProfileService.addTargetUniversity(userId, validated);

    res.status(201).json({
      status: "success",
      data: target
    });
  }
);

export const deleteTargetUniversity = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const targetId = req.params.targetId as string;

    const result = await studentProfileService.deleteTargetUniversity(userId, targetId);

    res.json({
      status: "success",
      message: result.message
    });
  }
);

/**
 * Certificates endpoints
 */

const addCertificateSchema = z.object({
  type: z.enum(["GRE", "GMAT", "CAT", "MAT", "OTHER"]),
  fileId: z.string().trim().min(1),
  comment: z.string().trim().max(500).optional()
});

export const getCertificates = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const certificates = await studentProfileService.getCertificates(userId);

    res.json({
      status: "success",
      data: certificates
    });
  }
);

export const addCertificate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const validated = addCertificateSchema.parse(req.body);

    const certificate = await studentProfileService.addCertificate(userId, validated);

    res.status(201).json({
      status: "success",
      data: certificate
    });
  }
);

export const deleteCertificate = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const certificateId = req.params.certificateId as string;

    const result = await studentProfileService.deleteCertificate(userId, certificateId);

    res.json({
      status: "success",
      message: result.message
    });
  }
);
