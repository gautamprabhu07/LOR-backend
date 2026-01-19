import apiClient from "./apiClient";

export type SubmissionStatus =
  | "submitted"
  | "resubmission"
  | "approved"
  | "rejected"
  | "completed";

export interface Employment {
  status: "employed" | "studying" | "unemployed";
  company?: string;
  role?: string;
  university?: string;
  course?: string;
  remarks?: string;
}

export interface TargetUniversity {
  _id: string;
  university: string;
  program: string;
  deadline: string;
  purpose: string;
}

export type CertificateType = "GRE" | "GMAT" | "CAT" | "MAT" | "OTHER";

export interface CertificateFileInfo {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface Certificate {
  _id: string;
  type: CertificateType;
  fileId: CertificateFileInfo | string;
  comment?: string;
}

export interface StudentProfile {
  _id: string;
  userId: string;
  registrationNumber: string;
  isAlumni: boolean;
  department: string;
  verificationStatus: "pending" | "verified" | "rejected";
  targetUniversities: TargetUniversity[];
  employment: Employment;
  certificates: Certificate[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  facultyId: string;
  status: SubmissionStatus;
  deadline: string;
  universityName?: string;
  purpose?: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileCompletion {
  percentage: number;
  completed: number;
  total: number;
  breakdown: {
    targets: boolean;
    certificates: boolean;
    employment: boolean;
  };
}

export interface SubmissionDetail {
  id: string;
  studentId: string;
  facultyId: string;
  status: SubmissionStatus;
  deadline: string;
  universityName?: string;
  purpose?: string;
  isAlumni: boolean;
  currentVersion: number;
  facultyNotes?: string;
  auditLog: {
    at: string;
    actorId: string;
    fromStatus: SubmissionStatus | null;
    toStatus: SubmissionStatus;
    remark?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionFile {
  _id: string;
  type: "draft" | "final" | "certificate";
  version: number;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface FacultyDirectoryEntry {
  id: string;
  facultyCode: string;
  department: string;
  designation: string;
  email?: string;
  displayName: string;
}

interface FacultyDirectoryResponse {
  status: "success";
  data: {
    profiles: FacultyDirectoryEntry[];
    total: number;
  };
}

interface ListSubmissionsResponse {
  status: "success";
  data: {
    submissions: StudentSubmission[];
    count: number;
  };
}

export const studentApi = {
  // Profile
  async getProfile(): Promise<StudentProfile> {
    const res = await apiClient.get<{ status: "success"; data: StudentProfile }>(
      "/api/student/profile"
    );
    return res.data.data;
  },

  async getProfileCompletion(): Promise<ProfileCompletion> {
    const res = await apiClient.get<{
      status: "success";
      data: ProfileCompletion;
    }>("/api/student/profile/completion");
    return res.data.data;
  },

  async getEmployment(): Promise<Employment> {
    const res = await apiClient.get<{ status: "success"; data: Employment }>(
      "/api/student/profile/employment"
    );
    return res.data.data;
  },

  async updateEmployment(payload: Employment): Promise<Employment> {
    const res = await apiClient.patch<{ status: "success"; data: Employment }>(
      "/api/student/profile/employment",
      payload
    );
    return res.data.data;
  },

  // Target universities
  async getTargets(): Promise<TargetUniversity[]> {
    const res = await apiClient.get<{
      status: "success";
      data: TargetUniversity[];
    }>("/api/student/profile/targets");
    return res.data.data;
  },

  async addTarget(payload: {
    university: string;
    program: string;
    deadline: string;
    purpose: string;
  }): Promise<TargetUniversity> {
    const res = await apiClient.post<{ status: "success"; data: TargetUniversity }>(
      "/api/student/profile/targets",
      payload
    );
    return res.data.data;
  },

  async deleteTarget(targetId: string): Promise<void> {
    await apiClient.delete(`/api/student/profile/targets/${targetId}`);
  },

  // Certificates
  async getCertificates(): Promise<Certificate[]> {
    const res = await apiClient.get<{
      status: "success";
      data: Certificate[];
    }>("/api/student/profile/certificates");
    return res.data.data;
  },

  async addCertificate(payload: {
    type: CertificateType;
    fileId: string;
    comment?: string;
  }): Promise<Certificate> {
    const res = await apiClient.post<{ status: "success"; data: Certificate }>(
      "/api/student/profile/certificates",
      payload
    );
    return res.data.data;
  },

  async deleteCertificate(certificateId: string): Promise<void> {
    await apiClient.delete(
      `/api/student/profile/certificates/${certificateId}`
    );
  },

  // Faculty Directory
  async listFacultyDirectory(params?: {
    search?: string;
    department?: string;
    limit?: number;
    skip?: number;
  }): Promise<FacultyDirectoryEntry[]> {
    const res = await apiClient.get<FacultyDirectoryResponse>(
      "/api/faculty/directory",
      { params }
    );
    return res.data.data.profiles;
  },

  // Submissions
  async listMySubmissions(): Promise<StudentSubmission[]> {
    const res = await apiClient.get<ListSubmissionsResponse>("/api/submissions");
    return res.data.data.submissions;
  },

  async createSubmission(payload: {
    facultyId: string;
    deadline: string;
    universityName?: string;
    purpose?: string;
  }): Promise<{ id: string }> {
    const res = await apiClient.post<{
      status: "success";
      data: {
        submission: {
          id: string;
        };
      };
    }>("/api/submissions", payload);
    return { id: res.data.data.submission.id };
  },

  async getSubmissionDetail(id: string): Promise<SubmissionDetail> {
    const res = await apiClient.get<{
      status: "success";
      data: { submission: SubmissionDetail };
    }>(`/api/submissions/${id}`);
    return res.data.data.submission;
  },

  async listSubmissionFiles(submissionId: string): Promise<SubmissionFile[]> {
    const res = await apiClient.get<{
      status: "success";
      data: SubmissionFile[];
    }>(`/api/files/submission/${submissionId}`);
    return res.data.data;
  },
};


