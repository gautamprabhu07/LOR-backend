import React, { useEffect, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { Employment } from "../../lib/studentApi";
import "./StudentEmploymentPage.css";
import { 
  FaBriefcase, 
  FaGraduationCap, 
  FaUserClock, 
  FaBuilding, 
  FaUserTie, 
  FaUniversity, 
  FaBookOpen, 
  FaCommentDots,
  FaSave,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner
} from "react-icons/fa";

type Status = Employment["status"];

interface StatusOption {
  value: Status;
  label: string;
  icon: React.ReactNode;
  description: string;
}

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

  const statusOptions: StatusOption[] = [
    {
      value: "employed",
      label: "Employed",
      icon: <FaBriefcase />,
      description: "Currently working in a company or organization"
    },
    {
      value: "studying",
      label: "Studying",
      icon: <FaGraduationCap />,
      description: "Enrolled in an educational institution"
    },
    {
      value: "unemployed",
      label: "Unemployed",
      icon: <FaUserClock />,
      description: "Currently seeking employment opportunities"
    }
  ];

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

  const handleStatusChange = (status: Status) => {
    setForm((prev) => ({ ...prev, status }));
    setMessage(null);
    setError(null);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
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
      setMessage("Employment details updated successfully.");
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
    return (
      <div className="employment-loading">
        <FaSpinner className="employment-spinner" />
        <span>Loading employment status…</span>
      </div>
    );
  }

  return (
    <div className="employment-root">
      <div className="employment-header">
        <div className="employment-header-content">
          <h1 className="employment-title">Employment Status</h1>
          <p className="employment-subtitle">
            Update your current academic or professional status to help us serve you better
          </p>
        </div>
        <div className="employment-status-chip">
          {form.status === "employed" && <FaBriefcase />}
          {form.status === "studying" && <FaGraduationCap />}
          {form.status === "unemployed" && <FaUserClock />}
          <span className={`status-${form.status}`}>
            {statusOptions.find(opt => opt.value === form.status)?.label}
          </span>
        </div>
      </div>

      {error && (
        <div className="employment-alert error">
          <FaExclamationCircle className="alert-icon" />
          <span>{error}</span>
        </div>
      )}
      
      {message && (
        <div className="employment-alert success">
          <FaCheckCircle className="alert-icon" />
          <span>{message}</span>
        </div>
      )}

      <form className="employment-form" onSubmit={handleSubmit}>
        <div className="employment-card">
          <div className="card-header">
            <h2 className="card-title">Select Your Current Status</h2>
            <p className="card-description">Choose the option that best describes your current situation</p>
          </div>

          <div className="employment-status-grid">
            {statusOptions.map((option) => (
              <div
                key={option.value}
                className={`status-card ${form.status === option.value ? 'active' : ''}`}
                onClick={() => handleStatusChange(option.value)}
              >
                <div className="status-card-icon">
                  {option.icon}
                </div>
                <div className="status-card-content">
                  <h3 className="status-card-label">{option.label}</h3>
                  <p className="status-card-description">{option.description}</p>
                </div>
                <div className="status-card-radio">
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={form.status === option.value}
                    onChange={() => handleStatusChange(option.value)}
                    aria-label={option.label}
                  />
                  <span className="radio-custom"></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {form.status === "employed" && (
          <div className="employment-card details-card">
            <div className="card-header">
              <h2 className="card-title">Employment Details</h2>
              <p className="card-description">Please provide information about your current employment</p>
            </div>
            <div className="employment-fields-grid">
              <div className="employment-field">
                <label className="employment-label" htmlFor="company">
                  <FaBuilding className="label-icon" />
                  Company Name
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  className="employment-input"
                  placeholder="Enter company name"
                  value={form.company || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="employment-field">
                <label className="employment-label" htmlFor="role">
                  <FaUserTie className="label-icon" />
                  Job Role
                </label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  className="employment-input"
                  placeholder="Enter your job role"
                  value={form.role || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {form.status === "studying" && (
          <div className="employment-card details-card">
            <div className="card-header">
              <h2 className="card-title">Academic Details</h2>
              <p className="card-description">Please provide information about your current studies</p>
            </div>
            <div className="employment-fields-grid">
              <div className="employment-field">
                <label className="employment-label" htmlFor="university">
                  <FaUniversity className="label-icon" />
                  University/Institution
                </label>
                <input
                  id="university"
                  name="university"
                  type="text"
                  className="employment-input"
                  placeholder="Enter university name"
                  value={form.university || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="employment-field">
                <label className="employment-label" htmlFor="course">
                  <FaBookOpen className="label-icon" />
                  Course/Program
                </label>
                <input
                  id="course"
                  name="course"
                  type="text"
                  className="employment-input"
                  placeholder="Enter course name"
                  value={form.course || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        {form.status === "unemployed" && (
          <div className="employment-card details-card">
            <div className="card-header">
              <h2 className="card-title">Additional Information</h2>
              <p className="card-description">Share any relevant details about your current situation</p>
            </div>
            <div className="employment-field">
              <label className="employment-label" htmlFor="remarks">
                <FaCommentDots className="label-icon" />
                Remarks (Optional)
              </label>
              <textarea
                id="remarks"
                name="remarks"
                className="employment-textarea"
                rows={4}
                placeholder="Enter any additional information..."
                value={form.remarks || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="employment-actions">
          <button
            type="submit"
            className="employment-save-button"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <FaSpinner className="button-icon spinning" />
                Saving Changes...
              </>
            ) : (
              <>
                <FaSave className="button-icon" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};