import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { studentApi } from "../../lib/studentApi";
import type { SubmissionDetail, SubmissionFile } from "../../lib/studentApi";
import apiClient from "../../lib/apiClient";
import {
  FiCalendar,
  FiClock,
  FiFileText,
  FiUpload,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiRefreshCw,
  FiSend,
  FiInfo,
} from "react-icons/fi";
import "./StudentRequestDetailPage.css";

type UploadState = {
  file: File | null;
};

const statusLabelMap: Record<string, string> = {
  submitted: "Submitted",
  resubmission: "Needs resubmission",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const statusConfig: Record<
  string,
  { icon: React.ReactNode; className: string }
> = {
  submitted: {
    icon: <FiSend size={14} />,
    className: "status-submitted",
  },
  resubmission: {
    icon: <FiRefreshCw size={14} />,
    className: "status-resubmission",
  },
  approved: {
    icon: <FiCheckCircle size={14} />,
    className: "status-approved",
  },
  rejected: {
    icon: <FiXCircle size={14} />,
    className: "status-rejected",
  },
  completed: {
    icon: <FiCheckCircle size={14} />,
    className: "status-completed",
  },
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }
  return fallback;
};

export const StudentRequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const submissionId = id as string;

  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftUpload, setDraftUpload] = useState<UploadState>({ file: null });

  const canUploadDraft = detail?.status === "resubmission";

  useEffect(() => {
    if (!submissionId) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [d, f] = await Promise.all([
          studentApi.getSubmissionDetail(submissionId),
          studentApi.listSubmissionFiles(submissionId),
        ]);
        if (!mounted) return;
        setDetail(d);
        setFiles(f);
      } catch (err: unknown) {
        if (mounted) {
          setError(getErrorMessage(err, "Failed to load submission details."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [submissionId]);

  const handleDraftFileChange: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    const file = e.target.files?.[0] || null;
    setDraftUpload({ file });
    setError(null);
    setMessage(null);
  };

  const handleDraftUpload: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!draftUpload.file) {
      setError("Please select a draft LoR file to upload.");
      return;
    }
    if (!detail || !canUploadDraft) {
      setError("Draft upload is not allowed in the current status.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const fd = new FormData();
      fd.append("file", draftUpload.file);

      await apiClient.post(`/api/files/upload-draft/${submissionId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Refresh file list and detail (currentVersion may change)
      const [updatedDetail, updatedFiles] = await Promise.all([
        studentApi.getSubmissionDetail(submissionId),
        studentApi.listSubmissionFiles(submissionId),
      ]);

      setDetail(updatedDetail);
      setFiles(updatedFiles);
      setDraftUpload({ file: null });
      setMessage("Draft uploaded successfully and replaced the previous draft.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload draft."));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const res = await apiClient.get<Blob>(`/api/files/${fileId}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to download file."));
    }
  };

  if (loading) {
    return (
      <div className="request-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading request details...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="request-detail-root">
        <div className="error-container">
          <FiAlertCircle size={48} />
          <h2>Unable to Load Submission</h2>
          <p>This submission may have been deleted or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  // Separate final files
  const finalFiles = files.filter((f) => f.type === "final");

  const latestDraft = files
    .filter((f) => f.type === "draft")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  const statusInfo = statusConfig[detail.status] || {
    icon: <FiInfo size={14} />,
    className: "status-default",
  };

  return (
    <div className="request-detail-root">
      <header className="request-detail-header">
        <div className="header-content">
          <div className="header-icon">
            <FiFileText size={24} />
          </div>
          <div className="header-info">
            <h1 className="request-detail-title">
              Letter of Recommendation Request
            </h1>
            <div className="request-detail-meta">
              <span className="meta-item">
                <FiCalendar size={14} />
                {new Date(detail.deadline).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="meta-item">
                <FiClock size={14} />
                {new Date(detail.deadline).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
        <div className={`request-detail-status-pill ${statusInfo.className}`}>
          {statusInfo.icon}
          <span>{statusLabelMap[detail.status] ?? detail.status}</span>
        </div>
      </header>

      <section className="request-detail-section">
        <h2 className="request-detail-section-title">
          <FiInfo size={18} />
          Overview
        </h2>
        <div className="overview-grid">
          <div className="overview-item">
            <label>Purpose</label>
            <p>{detail.purpose || "Not specified"}</p>
          </div>
          {detail.facultyNotes && (
            <div className="overview-item faculty-notes">
              <label>Faculty Notes</label>
              <p>{detail.facultyNotes}</p>
            </div>
          )}
        </div>
      </section>

      <section className="request-detail-section">
        <h2 className="request-detail-section-title">
          <FiClock size={18} />
          Activity Timeline
        </h2>
        {detail.auditLog.length === 0 ? (
          <div className="empty-state">
            <FiClock size={32} />
            <p>No activity recorded yet</p>
          </div>
        ) : (
          <ul className="request-detail-timeline">
            {detail.auditLog
              .slice()
              .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
              .map((entry, index) => {
                const toStatusConfig = statusConfig[entry.toStatus] || {
                  icon: <FiInfo size={14} />,
                  className: "status-default",
                };
                return (
                  <li key={index} className="request-detail-timeline-item">
                    <div className={`timeline-dot ${toStatusConfig.className}`}>
                      {toStatusConfig.icon}
                    </div>
                    <div className="request-detail-timeline-content">
                      <div className="request-detail-timeline-row">
                        <span className="request-detail-timeline-status">
                          {entry.fromStatus
                            ? `${statusLabelMap[entry.fromStatus]} → ${
                                statusLabelMap[entry.toStatus] ?? entry.toStatus
                              }`
                            : statusLabelMap[entry.toStatus] ?? entry.toStatus}
                        </span>
                        <span className="request-detail-timeline-date">
                          {new Date(entry.at).toLocaleString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {entry.remark && (
                        <p className="request-detail-timeline-remark">
                          {entry.remark}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {canUploadDraft && (
        <section className="request-detail-section">
          <form
            className="request-detail-upload-form"
            onSubmit={handleDraftUpload}
          >
            <div className="upload-form-header">
              <label className="request-detail-upload-label" htmlFor="draftFile">
                <FiUpload size={16} />
                Upload New Draft
                <span className="required-badge">Resubmission Required</span>
              </label>
            </div>
            <div className="upload-form-controls">
              <div className="file-input-wrapper">
                <input
                  id="draftFile"
                  name="draftFile"
                  type="file"
                  className="request-detail-file-input"
                  onChange={handleDraftFileChange}
                  accept=".pdf,.doc,.docx"
                />
                {draftUpload.file && (
                  <span className="file-selected">
                    <FiFileText size={14} />
                    {draftUpload.file.name}
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="request-detail-upload-button primary"
                disabled={uploading || !draftUpload.file}
              >
                {uploading ? (
                  <>
                    <div className="button-spinner"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <FiUpload size={14} />
                    <span>Upload Draft</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {finalFiles.length > 0 && (
        <section className="request-detail-section">
          <h2 className="request-detail-section-title">
            <FiCheckCircle size={18} />
            Final LoR
          </h2>
          {finalFiles.map((file) => (
            <div key={file._id} className="request-detail-final-card">
              <div className="final-card-icon">
                <FiFileText size={24} />
              </div>
              <div className="final-card-content">
                <div className="request-detail-final-name">
                  {file.originalName}
                </div>
                <div className="request-detail-final-meta">
                  <span>
                    <FiCalendar size={12} />
                    {new Date(file.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button
                type="button"
                className="request-detail-download-button primary"
                onClick={() => handleDownload(file._id)}
              >
                <FiDownload size={14} />
                <span>Download</span>
              </button>
            </div>
          ))}
        </section>
      )}

      {latestDraft && (
        <section className="request-detail-section">
          <h2 className="request-detail-section-title">
            <FiDownload size={18} />
            Current Draft LoR
          </h2>
          <div className="request-detail-final-card">
            <div className="final-card-icon">
              <FiFileText size={24} />
            </div>
            <div className="final-card-content">
              <div className="request-detail-final-name">
                {latestDraft.originalName}
              </div>
              <div className="request-detail-final-meta">
                <span>
                  <FiCalendar size={12} />
                  {new Date(latestDraft.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>•</span>
                <span>{(latestDraft.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
            <button
              type="button"
              className="request-detail-download-button"
              onClick={() => handleDownload(latestDraft._id)}
            >
              <FiDownload size={14} />
              <span>Download Draft</span>
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="alert alert-error">
          <FiXCircle size={16} />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="alert alert-success">
          <FiCheckCircle size={16} />
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};