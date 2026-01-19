import React, { useEffect, useMemo, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { TargetUniversity } from "../../lib/studentApi";
import "./StudentTargetsPage.css";
import UNIVERSITIES from "../../data/universities";

// Import icons (assuming react-icons is available, otherwise use SVG)
// If using react-icons: npm install react-icons
import { 
  FaGraduationCap, 
  FaBookOpen, 
  FaCalendarAlt, 
  FaPlus, 
  FaTrashAlt,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock
} from 'react-icons/fa';

interface FormState {
  university: string;
  program: string;
  deadline: string;
  purpose: string;
}

export const StudentTargetsPage: React.FC = () => {
  const [targets, setTargets] = useState<TargetUniversity[]>([]);
  const [form, setForm] = useState<FormState>({
    university: "",
    program: "",
    deadline: "",
    purpose: "",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await studentApi.getTargets();
        if (mounted) setTargets(data);
      } catch (err: unknown) {
        if (mounted) {
          const message =
            err && typeof err === "object" && "message" in err && 
            typeof (err as { message?: unknown }).message === "string"
              ? (err as { message: string }).message
              : "Failed to load targets.";
          setError(message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> =
    (e) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      setError(null);
    };

  const handleUniversityChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, university: value }));
    setError(null);
    setShowSuggestions(true);
  };

  const handleUniversitySelect = (name: string) => {
    setForm((prev) => ({ ...prev, university: name }));
    setShowSuggestions(false);
  };

  const filteredUniversities = useMemo(() => {
    const query = form.university.trim().toLowerCase();
    const results = query
      ? UNIVERSITIES.filter((uni) => uni.toLowerCase().includes(query))
      : UNIVERSITIES;
    return results.slice(0, 10);
  }, [form.university]);

  const handleAdd: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (targets.length >= 5) {
      setError("Maximum 5 target universities allowed.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const added = await studentApi.addTarget({
        university: form.university,
        program: form.program,
        deadline: new Date(form.deadline).toISOString(),
        purpose: form.purpose,
      });
      setTargets((prev) => [...prev, added]);
      setForm({
        university: "",
        program: "",
        deadline: "",
        purpose: "",
      });
      setSuccessMessage("Target university added successfully!");
      
      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && 
        typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to add target university.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await studentApi.deleteTarget(id);
      setTargets((prev) => prev.filter((t) => t._id !== id));
      setSuccessMessage("Target university removed successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && 
        typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to delete target.";
      setError(message);
    }
  };

  const calculateUrgency = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'past', label: 'Past Due', days: diffDays };
    if (diffDays <= 7) return { status: 'urgent', label: `${diffDays} days left`, days: diffDays };
    if (diffDays <= 30) return { status: 'soon', label: `${diffDays} days left`, days: diffDays };
    return { status: 'normal', label: `${diffDays} days left`, days: diffDays };
  };

  return (
    <div className="targets-root">
      {/* Header Section */}
      <div className="targets-header">
        <div className="targets-header-content">
          <div className="targets-header-icon-wrapper">
            <FaGraduationCap className="targets-header-icon" />
          </div>
          <div className="targets-header-text">
            <h1 className="targets-title">Target Universities</h1>
            <p className="targets-subtitle">
              Manage your application targets and track deadlines for letters of recommendation
            </p>
          </div>
        </div>
        <div className="targets-count-badge">
          <span className="targets-count-number">{targets.length}</span>
          <span className="targets-count-divider">/</span>
          <span className="targets-count-total">5</span>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="targets-alert targets-alert-error">
          <FaExclamationTriangle className="targets-alert-icon" />
          <span className="targets-alert-text">{error}</span>
          <button 
            className="targets-alert-close"
            onClick={() => setError(null)}
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="targets-alert targets-alert-success">
          <FaCheckCircle className="targets-alert-icon" />
          <span className="targets-alert-text">{successMessage}</span>
          <button 
            className="targets-alert-close"
            onClick={() => setSuccessMessage(null)}
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="targets-loading-container">
          <div className="targets-spinner"></div>
          <p className="targets-loading-text">Loading target universities...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Add Target Form */}
          <div className="targets-form-card">
            <div className="targets-form-header">
              <FaPlus className="targets-form-header-icon" />
              <h2 className="targets-form-title">Add New Target</h2>
            </div>

            <form className="targets-form" onSubmit={handleAdd}>
              <div className="targets-grid">
                <div className="targets-field targets-field-dropdown">
                  <label className="targets-label" htmlFor="university">
                    <FaGraduationCap className="targets-label-icon" />
                    <span>University Name</span>
                  </label>
                  <input
                    id="university"
                    name="university"
                    type="text"
                    className="targets-input"
                    value={form.university}
                    onChange={handleUniversityChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    placeholder="e.g., Stanford University"
                    required
                    autoComplete="off"
                  />
                  {showSuggestions && filteredUniversities.length > 0 && (
                    <div className="targets-suggestions" role="listbox">
                      {filteredUniversities.map((uni) => (
                        <button
                          key={uni}
                          type="button"
                          className="targets-suggestion-item"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleUniversitySelect(uni)}
                          role="option"
                        >
                          {uni}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="targets-field">
                  <label className="targets-label" htmlFor="program">
                    <FaBookOpen className="targets-label-icon" />
                    <span>Program / Course</span>
                  </label>
                  <input
                    id="program"
                    name="program"
                    type="text"
                    className="targets-input"
                    value={form.program}
                    onChange={handleChange}
                    placeholder="e.g., MS in Computer Science"
                    required
                  />
                </div>

                <div className="targets-field">
                  <label className="targets-label" htmlFor="deadline">
                    <FaCalendarAlt className="targets-label-icon" />
                    <span>LoR Deadline</span>
                  </label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    className="targets-input"
                    value={form.deadline}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="targets-field">
                <label className="targets-label" htmlFor="purpose">
                  <FaInfoCircle className="targets-label-icon" />
                  <span>Purpose / Comments</span>
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  rows={3}
                  className="targets-textarea"
                  value={form.purpose}
                  onChange={handleChange}
                  placeholder="Add notes about research interests, faculty, or special requirements..."
                  required
                />
              </div>

              <button
                type="submit"
                className="targets-add-button"
                disabled={isSaving}
              >
                <FaPlus className="targets-button-icon" />
                <span>{isSaving ? "Adding Target..." : "Add Target University"}</span>
              </button>
            </form>
          </div>

          {/* Targets List */}
          <div className="targets-list-section">
            <div className="targets-list-header">
              <h2 className="targets-list-title">Your Targets</h2>
              {targets.length > 0 && (
                <span className="targets-list-count">
                  {targets.length} {targets.length === 1 ? 'university' : 'universities'}
                </span>
              )}
            </div>

            {targets.length === 0 ? (
              <div className="targets-empty">
                <div className="targets-empty-icon-wrapper">
                  <FaGraduationCap className="targets-empty-icon" />
                </div>
                <h3 className="targets-empty-title">No targets added yet</h3>
                <p className="targets-empty-message">
                  Start by adding your first target university above
                </p>
              </div>
            ) : (
              <ul className="targets-list">
                {targets.map((target) => {
                  const urgency = calculateUrgency(target.deadline);
                  
                  return (
                    <li key={target._id} className="targets-item">
                      <div className="targets-item-accent"></div>
                      
                      <div className="targets-item-header">
                        <div className="targets-item-university">
                          <FaGraduationCap className="targets-item-icon" />
                          <h3 className="targets-item-name">{target.university}</h3>
                        </div>
                        <button
                          type="button"
                          className="targets-delete-button"
                          onClick={() => handleDelete(target._id)}
                          aria-label="Delete target"
                        >
                          <FaTrashAlt className="targets-delete-icon" />
                        </button>
                      </div>

                      <div className="targets-item-content">
                        <div className="targets-item-row">
                          <div className="targets-item-field">
                            <div className="targets-item-field-label">
                              <FaBookOpen className="targets-item-field-icon" />
                              <span>Program</span>
                            </div>
                            <span className="targets-item-value">{target.program}</span>
                          </div>

                          <div className="targets-item-field">
                            <div className="targets-item-field-label">
                              <FaCalendarAlt className="targets-item-field-icon" />
                              <span>Deadline</span>
                            </div>
                            <div className="targets-item-deadline-wrapper">
                              <span className="targets-item-value">
                                {new Date(target.deadline).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              <span className={`targets-urgency-badge targets-urgency-${urgency.status}`}>
                                <FaClock className="targets-urgency-icon" />
                                {urgency.label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="targets-item-purpose">
                          <div className="targets-item-field-label">
                            <FaInfoCircle className="targets-item-field-icon" />
                            <span>Purpose / Notes</span>
                          </div>
                          <p className="targets-item-purpose-text">{target.purpose}</p>
                        </div>
                      </div>
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