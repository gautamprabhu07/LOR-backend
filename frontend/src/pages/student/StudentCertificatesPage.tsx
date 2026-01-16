import React, { useEffect, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { Certificate, CertificateType } from "../../lib/studentApi";
import apiClient from "../../lib/apiClient";
import "./StudentCertificatesPage.css";

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
      // 1) upload file via existing file API (you may need to adjust path)
      const fd = new FormData();
      fd.append("file", form.file);
      const uploadRes = await apiClient.post<{
        status: "success";
        data: { fileId: string };
      }>("/api/files/upload-certificate", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileId = uploadRes.data.data.fileId;

      // 2) link certificate
      const added = await studentApi.addCertificate({
        type: form.type,
        fileId,
        comment: form.type === "OTHER" ? form.comment : undefined,
      });

      setCertificates((prev) => [...prev, added]);
      setForm({ type: "GRE", file: null, comment: "" });
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

  return (
    <div className="certificates-root">
      <h1 className="certificates-title">Certificates</h1>
      <p className="certificates-subtitle">
        Upload standardized test scores or other certificates. Maximum five.
      </p>

      {error && <p className="certificates-error">{error}</p>}
      {loading && <p className="certificates-info">Loading certificates…</p>}

      {!loading && (
        <>
          <div className="certificates-form-container">
            <form onSubmit={handleUpload}>
              <div className="certificates-field">
                <label className="certificates-label required" htmlFor="type">
                  Type
                </label>
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

              <div className="certificates-field">
                <label className="certificates-label required" htmlFor="file">
                  Certificate file
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  className="certificates-input"
                  onChange={handleFileChange}
                  required
                />
                {form.file && (
                  <div className="certificates-file-selected">
                    <span className="certificates-file-selected-name">
                      Selected: {form.file.name}
                    </span>
                  </div>
                )}
              </div>

              <div className={`certificates-comment-wrapper ${form.type === "OTHER" ? "visible" : ""}`}>
                <label className="certificates-label required" htmlFor="comment">
                  Comment
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={3}
                  className="certificates-textarea"
                  value={form.comment}
                  onChange={handleCommentChange}
                  required={form.type === "OTHER"}
                />
              </div>

              <div className="certificates-form-buttons">
                <button
                  type="submit"
                  className="certificates-button primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="certificates-loading">
                      <span className="certificates-spinner"></span>
                      Uploading…
                    </span>
                  ) : (
                    "Upload certificate"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="certificates-list-wrapper">
            <h2 className="certificates-list-title">Your Certificates</h2>
            {certificates.length === 0 ? (
              <p className="certificates-info">No certificates uploaded yet.</p>
            ) : (
              <ul className="certificates-list">
                {certificates.map((c) => {
                  const fileInfo = c.fileId as { originalName?: string; mimeType?: string } | undefined;
                  return (
                    <li key={c._id} className="certificates-item">
                      <div className="certificates-item-info">
                        <span className="certificates-item-type">{c.type}</span>
                        {fileInfo && fileInfo.originalName && (
                          <span className="certificates-item-file">
                            {fileInfo.originalName}
                          </span>
                        )}
                        {c.comment && (
                          <div className="certificates-item-comment">{c.comment}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="certificates-delete-button"
                        onClick={() => handleDelete(c._id)}
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};
