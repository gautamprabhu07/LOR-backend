import React, { useEffect, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { Employment } from "../../lib/studentApi";
import "./StudentEmploymentPage.css";

type Status = Employment["status"];

export const StudentEmploymentPage: React.FC = () => {
  const [form, setForm] = useState<Employment>({
    status: "studying",
    company: "",
    role: "",
    university: "",
    course: "",
    remarks: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await studentApi.getEmployment();
        if (mounted) {
          setForm({
            status: data.status,
            company: data.company || "",
            role: data.role || "",
            university: data.university || "",
            course: data.course || "",
            remarks: data.remarks || "",
          });
        }
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : "Failed to load employment.";
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

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setMessage(null);
    setError(null);
  };

  const handleStatusChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const status = e.target.value as Status;
    setForm((prev) => ({ ...prev, status }));
    setMessage(null);
    setError(null);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const updated = await studentApi.updateEmployment(form);
      setForm({
        status: updated.status,
        company: updated.company || "",
        role: updated.role || "",
        university: updated.university || "",
        course: updated.course || "",
        remarks: updated.remarks || "",
      });
      setMessage("Employment details updated.");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to update employment.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p>Loading employment status…</p>;
  }

  return (
    <div className="employment-root">
      <h1 className="employment-title">Update employment status</h1>
      <p className="employment-subtitle">
        Choose your current status and provide the relevant details.
      </p>

      {error && <p className="employment-error">{error}</p>}
      {message && <p className="employment-message">{message}</p>}

      <form className="employment-form" onSubmit={handleSubmit}>
        <fieldset className="employment-fieldset">
          <legend className="employment-legend">Current status</legend>
          <label className="employment-radio">
            <input
              type="radio"
              name="status"
              value="employed"
              checked={form.status === "employed"}
              onChange={handleStatusChange}
            />
            <span>Employed</span>
          </label>
          <label className="employment-radio">
            <input
              type="radio"
              name="status"
              value="studying"
              checked={form.status === "studying"}
              onChange={handleStatusChange}
            />
            <span>Studying</span>
          </label>
          <label className="employment-radio">
            <input
              type="radio"
              name="status"
              value="unemployed"
              checked={form.status === "unemployed"}
              onChange={handleStatusChange}
            />
            <span>Unemployed</span>
          </label>
        </fieldset>

        {form.status === "employed" && (
          <div className="employment-grid">
            <div className="employment-field">
              <label className="employment-label" htmlFor="company">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                className="employment-input"
                value={form.company || ""}
                onChange={handleChange}
              />
            </div>
            <div className="employment-field">
              <label className="employment-label" htmlFor="role">
                Role
              </label>
              <input
                id="role"
                name="role"
                type="text"
                className="employment-input"
                value={form.role || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {form.status === "studying" && (
          <div className="employment-grid">
            <div className="employment-field">
              <label className="employment-label" htmlFor="university">
                University
              </label>
              <input
                id="university"
                name="university"
                type="text"
                className="employment-input"
                value={form.university || ""}
                onChange={handleChange}
              />
            </div>
            <div className="employment-field">
              <label className="employment-label" htmlFor="course">
                Course
              </label>
              <input
                id="course"
                name="course"
                type="text"
                className="employment-input"
                value={form.course || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        {form.status === "unemployed" && (
          <div className="employment-field">
            <label className="employment-label" htmlFor="remarks">
              Remarks
            </label>
            <textarea
              id="remarks"
              name="remarks"
              className="employment-textarea"
              rows={3}
              value={form.remarks || ""}
              onChange={handleChange}
            />
          </div>
        )}

        <button
          type="submit"
          className="employment-save-button"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
};
