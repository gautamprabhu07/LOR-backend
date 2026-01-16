import React, { useState } from "react";
import { studentApi } from "../../lib/studentApi";
import apiClient from "../../lib/apiClient";
import "./StudentCreateLorPage.css";

interface FormState {
  facultyId: string;
  universityName: string;
  purpose: string;
  deadline: string;
  draftFile: File | null;
}

export const StudentCreateLorPage: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    facultyId: "",
    universityName: "",
    purpose: "",
    deadline: "",
    draftFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setMessage(null);
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, draftFile: file }));
    setError(null);
    setMessage(null);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.draftFile) {
      setError("Please upload a draft LoR file.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1) create submission metadata (purpose acts as comment)
      const { id } = await studentApi.createSubmission({
        facultyId: form.facultyId,
        deadline: form.deadline,
        universityName: form.universityName,
        purpose: form.purpose,
      });

      // 2) upload draft file linked to submission
      const fd = new FormData();
      fd.append("file", form.draftFile);
      await apiClient.post(
        `/api/files/upload-draft/${id}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage("LoR request created and draft uploaded.");
      setForm({
        facultyId: "",
        universityName: "",
        purpose: "",
        deadline: "",
        draftFile: null,
      });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to create LoR request.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lor-root">
      <h1 className="lor-title">Apply for Letter of Recommendation</h1>
      <p className="lor-subtitle">
        Choose a faculty member, provide university and purpose, and upload your
        draft LoR.
      </p>

      {error && <p className="lor-error">{error}</p>}
      {message && <p className="lor-message">{message}</p>}

      <form className="lor-form" onSubmit={handleSubmit}>
        <div className="lor-grid">
          <div className="lor-field">
            <label className="lor-label" htmlFor="facultyId">
              Faculty ID
            </label>
            <input
              id="facultyId"
              name="facultyId"
              type="text"
              className="lor-input"
              value={form.facultyId}
              onChange={handleChange}
              required
            />
          </div>

          <div className="lor-field">
            <label className="lor-label" htmlFor="deadline">
              Deadline for LoR
            </label>
            <input
              id="deadline"
              name="deadline"
              type="datetime-local"
              className="lor-input"
              value={form.deadline}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="lor-field">
          <label className="lor-label" htmlFor="universityName">
            University
          </label>
          <input
            id="universityName"
            name="universityName"
            type="text"
            className="lor-input"
            value={form.universityName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="lor-field">
          <label className="lor-label" htmlFor="purpose">
            Purpose / comments (visible to faculty)
          </label>
          <textarea
            id="purpose"
            name="purpose"
            rows={3}
            className="lor-textarea"
            value={form.purpose}
            onChange={handleChange}
            required
          />
        </div>

        <div className="lor-field">
          <label className="lor-label" htmlFor="draft">
            Draft LoR file
          </label>
          <input
            id="draft"
            name="draft"
            type="file"
            className="lor-file-input"
            onChange={handleFileChange}
            required
          />
        </div>

        <button
          type="submit"
          className="lor-submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting…" : "Create LoR request"}
        </button>
      </form>
    </div>
  );
};
