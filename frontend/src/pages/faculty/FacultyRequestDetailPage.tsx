// src/pages/faculty/FacultyRequestDetailPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiDownload,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCcw,
  FiUpload,
  FiFileText,
  FiClock,
  FiUser,
  FiBriefcase,
  FiAward,
  FiCalendar,
  FiAlertCircle,
  FiChevronLeft,
  FiEdit3,
} from "react-icons/fi";
import apiClient from "../../lib/apiClient";
import "./FacultyRequestDetailPage.css";

type SubmissionStatus =
  | "submitted"
  | "resubmission"
  | "approved"
  | "rejected"
  | "completed";

interface AuditEntry {
  at: string;
  actorId: string;
  fromStatus: SubmissionStatus | null;
  toStatus: SubmissionStatus;
  remark?: string;
}

interface SubmissionDetail {
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
  auditLog: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

type FileType = "draft" | "final" | "certificate";

interface SubmissionFile {
  _id: string;
  type: FileType;
  version: number;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface StudentTarget {
  _id: string;
  university: string;
  program: string;
  deadline: string;
  purpose: string;
}

interface Employment {
  status: "employed" | "studying" | "unemployed";
  company?: string;
  role?: string;
  university?: string;
  course?: string;
  remarks?: string;
}

interface Certificate {
  _id: string;
  type: string;
  fileId:
    | string
    | {
        _id: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedAt: string;
      }
    | null;
  comment?: string;
}

interface StudentContext {
  name?: string;
  email?: string;
  registrationNumber: string;
  department: string;
  targets: StudentTarget[];
  employment: Employment;
  certificates: Certificate[];
}

interface SubmissionDetailResponse {
  status: "success";
  data: {
    submission: SubmissionDetail;
    studentContext: StudentContext | null;
  };
}

const statusLabelMap: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  resubmission: "Resubmission Required",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const statusIconMap: Record<SubmissionStatus, React.ReactNode> = {
  submitted: <FiClock />,
  resubmission: <FiRefreshCcw />,
  approved: <FiCheckCircle />,
  rejected: <FiXCircle />,
  completed: <FiCheckCircle />,
};

export const FacultyRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const submissionId = id as string;
  const navigate = useNavigate();

  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [student, setStudent] = useState<StudentContext | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingFinal, setUploadingFinal] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (!submissionId) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [detailRes, filesRes] = await Promise.all([
          apiClient.get<SubmissionDetailResponse>(
            `/api/submissions/${submissionId}`
          ),
          apiClient.get<{
            status: "success";
            data: SubmissionFile[];
          }>(`/api/files/submission/${submissionId}`),
        ]);

        if (!mounted) return;
        setDetail(detailRes.data.data.submission);
        setFiles(filesRes.data.data);
        setStudent(detailRes.data.data.studentContext || null);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load request details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [submissionId]);

  const draftFiles = useMemo(
    () => files.filter((f) => f.type === "draft"),
    [files]
  );
  const finalFiles = useMemo(
    () => files.filter((f) => f.type === "final"),
    [files]
  );
  const hasFinal = finalFiles.length > 0;

  const canUploadFinal =
    detail &&
    !hasFinal &&
    detail.status === "approved" &&
    !uploadingFinal &&
    !actionLoading;

  const isRejected = detail?.status === "rejected";
  const isApproved = detail?.status === "approved";
  const isCompleted = detail?.status === "completed";

  const disableAllActions = isRejected || isCompleted;
  const disableResubmission =
    disableAllActions || isApproved || actionLoading || uploadingFinal;
  const disableReject =
    disableAllActions || isApproved || actionLoading || uploadingFinal;
  const disableApprove =
    disableAllActions || isApproved || actionLoading || uploadingFinal;
  const disableComplete =
    disableAllActions || !isApproved || actionLoading || uploadingFinal;

  const handleDownload = async (fileId: string, name?: string) => {
    try {
      const res = await apiClient.get<Blob>(`/api/files/${fileId}/download`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name || "lor.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to download file.");
    }
  };

  const handleFinalFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0] || null;
    setFinalFile(file);
    setMessage(null);
    setError(null);
  };

  const refreshFilesAndDetail = async () => {
    const [detailRes, filesRes] = await Promise.all([
      apiClient.get<SubmissionDetailResponse>(
        `/api/submissions/${submissionId}`
      ),
      apiClient.get<{
        status: "success";
        data: SubmissionFile[];
      }>(`/api/files/submission/${submissionId}`),
    ]);
    setDetail(detailRes.data.data.submission);
    setFiles(filesRes.data.data);
    setStudent(detailRes.data.data.studentContext || null);
  };

  const handleUploadFinal: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!detail) return;
    if (!finalFile) {
      setError("Please select a final LoR PDF to upload.");
      return;
    }
    if (!canUploadFinal) return;

    try {
      setUploadingFinal(true);
      setError(null);
      setMessage(null);

      const fd = new FormData();
      fd.append("file", finalFile);

      await apiClient.post(
        `/api/files/upload-final/${submissionId}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      await refreshFilesAndDetail();
      setFinalFile(null);
      setMessage("Final LoR uploaded and request marked as completed.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload final LoR.");
    } finally {
      setUploadingFinal(false);
    }
  };

  const handleDeleteFinal = async (fileId: string) => {
    try {
      setActionLoading(true);
      setError(null);
      setMessage(null);

      await apiClient.delete(`/api/files/${fileId}`);
      await refreshFilesAndDetail();
      setMessage("Final LoR deleted. You can upload a new one.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete final LoR.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (newStatus: SubmissionStatus) => {
    if (!detail) return;
    try {
      setActionLoading(true);
      setError(null);
      setMessage(null);

      await apiClient.post(`/api/submissions/${submissionId}/status`, {
        newStatus,
        remark: remark || undefined,
      });

      await refreshFilesAndDetail();
      setRemark("");
      setMessage(`Status updated to ${statusLabelMap[newStatus]}.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="frd-root">
        <div className="frd-loading-state">
          <div className="frd-spinner" />
          <p>Loading request details...</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="frd-root">
        <div className="frd-empty-state">
          <FiAlertCircle className="frd-empty-icon" />
          <h2>Request Not Found</h2>
          <p>Unable to load this submission. It may not belong to you or may have been deleted.</p>
          <button
            type="button"
            className="frd-btn frd-btn-secondary"
            onClick={() => navigate("/faculty")}
          >
            <FiChevronLeft />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const primaryTarget =
    student?.targets && student.targets.length > 0
      ? student.targets[0]
      : null;

  const studentDisplayName =
    student?.name || student?.registrationNumber || "Student";

  return (
    <div className="frd-root">
      {/* Header Section */}
      <header className="frd-header">
        <div className="frd-header-nav">
          <button
            className="frd-back-btn"
            onClick={() => navigate("/faculty")}
          >
            <FiChevronLeft />
          </button>
          <div className="frd-breadcrumb">
            <span className="frd-breadcrumb-link" onClick={() => navigate("/faculty")}>
              Requests
            </span>
            <span className="frd-breadcrumb-separator">/</span>
            <span className="frd-breadcrumb-current">Detail</span>
          </div>
        </div>

        <div className="frd-header-content">
          <div className="frd-header-title-section">
            <h1 className="frd-title">
              {detail.universityName || "Letter of Recommendation Request"}
            </h1>
            <p className="frd-subtitle">
              Review student context, drafts, and activity timeline to make an informed decision
            </p>
          </div>

          <div className="frd-header-meta">
            <div className={`frd-status-badge frd-status-${detail.status}`}>
              {statusIconMap[detail.status]}
              <span>{statusLabelMap[detail.status]}</span>
            </div>
            <div className="frd-deadline-badge">
              <FiCalendar />
              <span>
                Due {new Date(detail.deadline).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Alert Messages */}
      {error && (
        <div className="frd-alert frd-alert-error">
          <FiXCircle />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="frd-alert frd-alert-success">
          <FiCheckCircle />
          <span>{message}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="frd-grid">
        {/* Left Column */}
        <div className="frd-column frd-column-left">
          {/* Student Overview Card */}
          <div className="frd-card">
            <div className="frd-card-header">
              <div className="frd-card-header-icon">
                <FiUser />
              </div>
              <h2 className="frd-card-title">Student Overview</h2>
            </div>
            <div className="frd-card-body">
              <div className="frd-info-row">
                <span className="frd-info-label">Student Name</span>
                <span className="frd-info-value">{studentDisplayName}</span>
              </div>

              <div className="frd-info-row">
                <span className="frd-info-label">Student ID</span>
                <span className="frd-info-value frd-mono">{detail.studentId}</span>
              </div>

              {student ? (
                <>
                  <div className="frd-info-row">
                    <span className="frd-info-label">Registration</span>
                    <span className="frd-info-value">{student.registrationNumber}</span>
                  </div>
                  <div className="frd-info-row">
                    <span className="frd-info-label">Department</span>
                    <span className="frd-info-value">{student.department}</span>
                  </div>
                </>
              ) : (
                <p className="frd-muted-text">
                  Additional profile information will appear here once available
                </p>
              )}

              <div className="frd-divider" />

              <div className="frd-section-header">
                <FiBriefcase className="frd-section-icon" />
                <h3>Target University</h3>
              </div>

              <div className="frd-info-row">
                <span className="frd-info-label">University</span>
                <span className="frd-info-value">
                  {primaryTarget?.university || detail.universityName || "Not specified"}
                </span>
              </div>

              <div className="frd-info-row">
                <span className="frd-info-label">Deadline</span>
                <span className="frd-info-value">
                  {new Date(primaryTarget?.deadline || detail.deadline).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    }
                  )}
                </span>
              </div>

              <div className="frd-info-row">
                <span className="frd-info-label">Program</span>
                <span className="frd-info-value">
                  {primaryTarget?.program || "Not specified"}
                </span>
              </div>

              <div className="frd-info-row">
                <span className="frd-info-label">Purpose</span>
                <span className="frd-info-value">
                  {primaryTarget?.purpose || detail.purpose || "Not specified"}
                </span>
              </div>

              <div className="frd-divider" />

              <div className="frd-section-header">
                <FiBriefcase className="frd-section-icon" />
                <h3>Employment Status</h3>
              </div>

              {student?.employment ? (
                <>
                  <div className="frd-info-row">
                    <span className="frd-info-label">Status</span>
                    <span className="frd-info-value frd-capitalize">
                      {student.employment.status}
                    </span>
                  </div>
                  {student.employment.status === "employed" && (
                    <>
                      {student.employment.company && (
                        <div className="frd-info-row">
                          <span className="frd-info-label">Company</span>
                          <span className="frd-info-value">
                            {student.employment.company}
                          </span>
                        </div>
                      )}
                      {student.employment.role && (
                        <div className="frd-info-row">
                          <span className="frd-info-label">Role</span>
                          <span className="frd-info-value">
                            {student.employment.role}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {student.employment.status === "studying" && (
                    <>
                      {student.employment.university && (
                        <div className="frd-info-row">
                          <span className="frd-info-label">University</span>
                          <span className="frd-info-value">
                            {student.employment.university}
                          </span>
                        </div>
                      )}
                      {student.employment.course && (
                        <div className="frd-info-row">
                          <span className="frd-info-label">Course</span>
                          <span className="frd-info-value">
                            {student.employment.course}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {student.employment.remarks && (
                    <div className="frd-info-row">
                      <span className="frd-info-label">Remarks</span>
                      <span className="frd-info-value">
                        {student.employment.remarks}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="frd-muted-text">Employment details not available</p>
              )}

              <div className="frd-divider" />

              <div className="frd-section-header">
                <FiAward className="frd-section-icon" />
                <h3>Certificates</h3>
              </div>

              {student?.certificates && student.certificates.length > 0 ? (
                <ul className="frd-cert-list">
                  {student.certificates.map((c) => {
                    const fileInfo =
                      c.fileId && typeof c.fileId !== "string"
                        ? c.fileId
                        : null;
                    const viewUrl = fileInfo
                      ? `${apiClient.defaults.baseURL ?? ""}/api/files/certificates/${fileInfo._id}/view`
                      : null;

                    return (
                    <li key={c._id} className="frd-cert-item">
                      <FiAward className="frd-cert-icon" />
                      <div className="frd-cert-content">
                        <span className="frd-cert-type">{c.type}</span>
                        {c.comment && (
                          <span className="frd-cert-comment">{c.comment}</span>
                        )}
                        {fileInfo ? (
                          <div className="frd-cert-meta">
                            <FiFileText className="frd-cert-file-icon" />
                            <a
                              className="frd-cert-file-link"
                              href={viewUrl || "#"}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {fileInfo.originalName}
                            </a>
                            <span className="frd-cert-file-size">
                              {(fileInfo.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        ) : (
                          <span className="frd-cert-comment">File unavailable</span>
                        )}
                      </div>
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="frd-muted-text">No certificates on record</p>
              )}
            </div>
          </div>

          {/* Activity Timeline Card */}
          <div className="frd-card">
            <div className="frd-card-header">
              <div className="frd-card-header-icon">
                <FiClock />
              </div>
              <h2 className="frd-card-title">Activity Timeline</h2>
            </div>
            <div className="frd-card-body">
              {detail.auditLog.length === 0 ? (
                <p className="frd-muted-text">No activity recorded yet</p>
              ) : (
                <ul className="frd-timeline">
                  {detail.auditLog
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.at).getTime() - new Date(a.at).getTime()
                    )
                    .map((entry, idx) => (
                      <li key={idx} className="frd-timeline-item">
                        <div className={`frd-timeline-marker frd-marker-${entry.toStatus}`} />
                        <div className="frd-timeline-content">
                          <div className="frd-timeline-header">
                            <span className="frd-timeline-status">
                              {entry.fromStatus
                                ? `${statusLabelMap[entry.fromStatus]} → ${
                                    statusLabelMap[entry.toStatus]
                                  }`
                                : statusLabelMap[entry.toStatus]}
                            </span>
                            <span className="frd-timeline-date">
                              {new Date(entry.at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {entry.remark && (
                            <p className="frd-timeline-remark">{entry.remark}</p>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="frd-column frd-column-right">
          {/* Draft Files Card */}
          <div className="frd-card">
            <div className="frd-card-header">
              <div className="frd-card-header-icon">
                <FiFileText />
              </div>
              <h2 className="frd-card-title">Draft Submissions</h2>
            </div>
            <div className="frd-card-body">
              {draftFiles.length === 0 ? (
                <div className="frd-empty-section">
                  <FiFileText className="frd-empty-section-icon" />
                  <p>No drafts uploaded yet</p>
                </div>
              ) : (
                <div className="frd-file-list">
                  {draftFiles.map((f) => (
                    <div key={f._id} className="frd-file-card">
                      <div className="frd-file-icon">
                        <FiFileText />
                      </div>
                      <div className="frd-file-info">
                        <div className="frd-file-name">{f.originalName}</div>
                        <div className="frd-file-meta">
                          <span className="frd-file-version">Version {f.version}</span>
                          <span className="frd-file-dot">•</span>
                          <span className="frd-file-date">
                            {new Date(f.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="frd-file-dot">•</span>
                          <span className="frd-file-size">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        className="frd-btn frd-btn-icon"
                        onClick={() => handleDownload(f._id, f.originalName)}
                      >
                        <FiDownload />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Final LoR Card */}
          <div className="frd-card">
            <div className="frd-card-header">
              <div className="frd-card-header-icon">
                <FiCheckCircle />
              </div>
              <h2 className="frd-card-title">Final Letter of Recommendation</h2>
            </div>
            <div className="frd-card-body">
              {hasFinal ? (
                <>
                  {finalFiles.map((f) => (
                    <div key={f._id} className="frd-final-file">
                      <div className="frd-file-card frd-file-card-final">
                        <div className="frd-file-icon">
                          <FiCheckCircle />
                        </div>
                        <div className="frd-file-info">
                          <div className="frd-file-name">{f.originalName}</div>
                          <div className="frd-file-meta">
                            <span>
                              {new Date(f.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span className="frd-file-dot">•</span>
                            <span>{(f.size / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                        <div className="frd-file-actions">
                          <button
                            className="frd-btn frd-btn-secondary frd-btn-sm"
                            onClick={() => handleDownload(f._id, f.originalName)}
                          >
                            <FiDownload />
                            Download
                          </button>
                          <button
                            className="frd-btn frd-btn-danger frd-btn-sm"
                            onClick={() => handleDeleteFinal(f._id)}
                            disabled={actionLoading || isCompleted}
                          >
                            <FiTrash2 />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="frd-empty-section">
                    <FiUpload className="frd-empty-section-icon" />
                    <p>No final LoR uploaded</p>
                  </div>

                  <form className="frd-upload-form" onSubmit={handleUploadFinal}>
                    <div className="frd-upload-area">
                      <input
                        id="finalFile"
                        type="file"
                        accept="application/pdf"
                        className="frd-file-input-hidden"
                        onChange={handleFinalFileChange}
                        disabled={!canUploadFinal}
                      />
                      <label
                        htmlFor="finalFile"
                        className={`frd-upload-label ${!canUploadFinal ? "frd-upload-disabled" : ""}`}
                      >
                        <FiUpload className="frd-upload-icon" />
                        <span className="frd-upload-text">
                          {finalFile ? finalFile.name : "Choose PDF file"}
                        </span>
                        <span className="frd-upload-hint">Click to browse</span>
                      </label>
                    </div>

                    {finalFile && (
                      <button
                        type="submit"
                        className="frd-btn frd-btn-primary frd-btn-full"
                        disabled={!canUploadFinal}
                      >
                        <FiUpload />
                        {uploadingFinal ? "Uploading..." : "Upload & Mark Complete"}
                      </button>
                    )}

                    {detail.status !== "approved" && (
                      <p className="frd-helper-text">
                        <FiAlertCircle />
                        Final upload is only available after approving the draft
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Faculty Decision Card */}
          <div className="frd-card">
            <div className="frd-card-header">
              <div className="frd-card-header-icon">
                <FiEdit3 />
              </div>
              <h2 className="frd-card-title">Faculty Decision</h2>
            </div>
            <div className="frd-card-body">
              <div className="frd-form-group">
                <label className="frd-label" htmlFor="remark">
                  Feedback for Student
                </label>
                <textarea
                  id="remark"
                  className="frd-textarea"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Provide specific feedback, suggestions for improvement, or reasons for your decision..."
                  rows={4}
                  disabled={disableAllActions}
                />
                <p className="frd-helper-text">
                  Clear feedback helps students understand and improve their submissions
                </p>
              </div>

              <div className="frd-action-grid">
                <button
                  className="frd-btn frd-btn-warning"
                  onClick={() => updateStatus("resubmission")}
                  disabled={disableResubmission}
                >
                  <FiRefreshCcw />
                  Request Resubmission
                </button>

                <button
                  className="frd-btn frd-btn-danger"
                  onClick={() => updateStatus("rejected")}
                  disabled={disableReject}
                >
                  <FiXCircle />
                  Reject Request
                </button>

                <button
                  className="frd-btn frd-btn-success"
                  onClick={() => updateStatus("approved")}
                  disabled={disableApprove}
                >
                  <FiCheckCircle />
                  Approve Draft
                </button>

                <button
                  className="frd-btn frd-btn-primary"
                  onClick={() => updateStatus("completed")}
                  disabled={disableComplete}
                >
                  <FiCheckCircle />
                  Mark Completed
                </button>
              </div>

              {isRejected && (
                <div className="frd-status-notice frd-notice-rejected">
                  <FiXCircle />
                  <p>This request has been rejected. No further actions are allowed.</p>
                </div>
              )}

              {isCompleted && (
                <div className="frd-status-notice frd-notice-completed">
                  <FiCheckCircle />
                  <p>Request completed successfully. Status cannot be changed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyRequestDetailPage;