import React, { useEffect, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { Certificate, CertificateType } from "../../lib/studentApi";
import apiClient from "../../lib/apiClient";
import "./StudentCertificatesPage.css";
import { 
  FiUpload, 
  FiFile, 
  FiTrash2, 
  FiCheck, 
  FiAlertCircle,
  FiAward,
  FiFileText,
  FiX
} from "react-icons/fi";

interface UploadState {
  type: CertificateType;
  file: File | null;
  comment: string;
}

const certificateTypes: CertificateType[] = [
  "GRE",
  "GMAT",
  "CAT",
  "MAT",
  "OTHER",
];

const certificateIcons: Record<CertificateType, React.ReactNode> = {
  GRE: <FiAward className="cert-type-icon" />,
  GMAT: <FiAward className="cert-type-icon" />,
  CAT: <FiAward className="cert-type-icon" />,
  MAT: <FiAward className="cert-type-icon" />,
  OTHER: <FiFileText className="cert-type-icon" />,
};

export const StudentCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [form, setForm] = useState<UploadState>({
    type: "GRE",
    file: null,
    comment: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await studentApi.getCertificates();
        if (mounted) setCertificates(data);
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : "Failed to load certificates.";
        if (mounted) setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleTypeChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const type = e.target.value as CertificateType;
    setForm((prev) => ({ ...prev, type }));
    setError(null);
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, file }));
    setError(null);
  };

  const handleCommentChange: React.ChangeEventHandler<HTMLTextAreaElement> = (
    e
  ) => {
    setForm((prev) => ({ ...prev, comment: e.target.value }));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setForm((prev) => ({ ...prev, file: e.dataTransfer.files[0] }));
      setError(null);
    }
  };

  const handleUpload: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!form.file) {
      setError("Please choose a certificate file.");
      return;
    }
    if (certificates.length >= 5) {
      setError("Maximum 5 certificates allowed.");
      return;
    }

    setIsSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", form.file);
      const uploadRes = await apiClient.post<{
        status: "success";
        data: { fileId: string };
      }>("/api/files/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileId = uploadRes.data.data.fileId;

      const added = await studentApi.addCertificate({
        type: form.type,
        fileId,
        comment: form.type === "OTHER" ? form.comment : undefined,
      });

      setCertificates((prev) => [...prev, added]);
      setForm({ type: "GRE", file: null, comment: "" });
      setError(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to upload certificate.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await studentApi.deleteCertificate(id);
      setCertificates((prev) => prev.filter((c) => c._id !== id));
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to delete certificate.";
      setError(message);
    }
  };

  const clearFile = () => {
    setForm((prev) => ({ ...prev, file: null }));
  };

  return (
    <div className="certificates-root">
      <div className="certificates-header">
        <div className="certificates-header-content">
          <div className="certificates-header-icon">
            <FiAward />
          </div>
          <div>
            <h1 className="certificates-title">Academic Certificates</h1>
            <p className="certificates-subtitle">
              Upload standardized test scores and academic credentials (Maximum 5 certificates)
            </p>
          </div>
        </div>
        <div className="certificates-count-badge">
          {certificates.length} / 5
        </div>
      </div>

      {error && (
        <div className="certificates-alert certificates-alert-error">
          <FiAlertCircle className="certificates-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="certificates-loading-container">
          <div className="certificates-spinner-large"></div>
          <p className="certificates-loading-text">Loading certificates...</p>
        </div>
      ) : (
        <>
          <div className="certificates-form-card">
            <div className="certificates-form-header">
              <FiUpload className="certificates-form-header-icon" />
              <h2 className="certificates-form-title">Upload New Certificate</h2>
            </div>

            <form onSubmit={handleUpload} className="certificates-form">
              <div className="certificates-field-group">
                <label className="certificates-label" htmlFor="type">
                  Certificate Type
                  <span className="certificates-required">*</span>
                </label>
                <div className="certificates-select-wrapper">
                  <select
                    id="type"
                    name="type"
                    className="certificates-select"
                    value={form.type}
                    onChange={handleTypeChange}
                  >
                    {certificateTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="certificates-field-group">
                <label className="certificates-label">
                  Certificate Document
                  <span className="certificates-required">*</span>
                </label>
                <div
                  className={`certificates-upload-zone ${dragActive ? "drag-active" : ""} ${form.file ? "has-file" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {form.file ? (
                    <div className="certificates-file-preview">
                      <div className="certificates-file-preview-content">
                        <FiFile className="certificates-file-preview-icon" />
                        <div className="certificates-file-preview-info">
                          <span className="certificates-file-preview-name">
                            {form.file.name}
                          </span>
                          <span className="certificates-file-preview-size">
                            {(form.file.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="certificates-file-remove"
                        onClick={clearFile}
                        aria-label="Remove file"
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        className="certificates-file-input"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="file" className="certificates-upload-label">
                        <FiUpload className="certificates-upload-icon" />
                        <div className="certificates-upload-text">
                          <span className="certificates-upload-primary">
                            Drop your file here or click to browse
                          </span>
                          <span className="certificates-upload-secondary">
                            PDF, JPG, PNG (Max 10MB)
                          </span>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {form.type === "OTHER" && (
                <div className="certificates-field-group certificates-comment-field">
                  <label className="certificates-label" htmlFor="comment">
                    Additional Information
                    <span className="certificates-required">*</span>
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    className="certificates-textarea"
                    placeholder="Please specify the type of certificate and any relevant details..."
                    value={form.comment}
                    onChange={handleCommentChange}
                    required={form.type === "OTHER"}
                  />
                </div>
              )}

              <div className="certificates-form-actions">
                <button
                  type="submit"
                  className="certificates-btn certificates-btn-primary"
                  disabled={isSaving || !form.file}
                >
                  {isSaving ? (
                    <>
                      <span className="certificates-spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FiCheck />
                      Upload Certificate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="certificates-list-section">
            <div className="certificates-list-header">
              <h2 className="certificates-list-title">
                <FiFileText className="certificates-list-title-icon" />
                Your Certificates
              </h2>
            </div>

            {certificates.length === 0 ? (
              <div className="certificates-empty-state">
                <div className="certificates-empty-icon">
                  <FiFileText />
                </div>
                <p className="certificates-empty-title">No certificates uploaded</p>
                <p className="certificates-empty-text">
                  Upload your first certificate to get started
                </p>
              </div>
            ) : (
              <div className="certificates-grid">
                {certificates.map((c) => {
                  const fileInfo =
                    typeof c.fileId === "string"
                      ? undefined
                      : (c.fileId as { _id?: string; originalName?: string; mimeType?: string } | undefined);
                  const fileId = typeof c.fileId === "string" ? c.fileId : fileInfo?._id;
                  const fileName = fileInfo?.originalName || "View certificate";
                  const viewUrl = fileId
                    ? `${apiClient.defaults.baseURL ?? ""}/api/files/certificates/${fileId}/view`
                    : undefined;

                  return (
                    <div key={c._id} className="certificates-card">
                      <div className="certificates-card-header">
                        <div className="certificates-card-type">
                          {certificateIcons[c.type]}
                          <span>{c.type}</span>
                        </div>
                        <button
                          type="button"
                          className="certificates-card-delete"
                          onClick={() => handleDelete(c._id)}
                          aria-label="Delete certificate"
                        >
                          <FiTrash2 />
                        </button>
                      </div>

                      {c.type === "OTHER" && c.comment && (
                        <div className="certificates-card-comment">
                          <span className="certificates-card-comment-label">
                            Additional information
                          </span>
                          <p>{c.comment}</p>
                        </div>
                      )}

                      {viewUrl && (
                        <a
                          className="certificates-card-file-link"
                          href={viewUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FiFile className="certificates-card-file-icon" />
                          <span className="certificates-card-file-name">{fileName}</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};