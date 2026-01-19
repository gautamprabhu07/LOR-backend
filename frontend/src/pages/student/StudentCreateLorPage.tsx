import React, { useEffect, useState } from "react";
import { studentApi } from "../../lib/studentApi";
import type { FacultyDirectoryEntry } from "../../lib/studentApi";
import apiClient from "../../lib/apiClient";
import "./StudentCreateLorPage.css";
import {
  FaUserGraduate,
  FaUniversity,
  FaBullseye,
  FaCalendarAlt,
  FaFileUpload,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner,
  FaFileAlt,
  FaTimes,
  FaCloudUploadAlt,
  FaInfoCircle,
  FaChevronRight
} from "react-icons/fa";

interface FormState {
  facultyId: string;
  purpose: string;
  deadline: string;
  draftFile: File | null;
}

interface StepInfo {
  number: number;
  title: string;
  icon: React.ReactNode;
  description: string;
}

export const StudentCreateLorPage: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    facultyId: "",
    purpose: "",
    deadline: "",
    draftFile: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [facultyOptions, setFacultyOptions] = useState<FacultyDirectoryEntry[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultyError, setFacultyError] = useState<string | null>(null);
  const [facultyQuery, setFacultyQuery] = useState("");
  const [isFacultyOpen, setIsFacultyOpen] = useState(false);

  const steps: StepInfo[] = [
    {
      number: 1,
      title: "Faculty Selection",
      icon: <FaUserGraduate />,
      description: "Choose your recommender"
    },
    {
      number: 2,
      title: "Request Details",
      icon: <FaUniversity />,
      description: "Provide university & purpose"
    },
    {
      number: 3,
      title: "Upload Draft",
      icon: <FaFileUpload />,
      description: "Attach your LoR draft"
    },
    {
      number: 4,
      title: "Submit",
      icon: <FaPaperPlane />,
      description: "Review and send request"
    }
  ];

  const handleChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setMessage(null);
  };

  const getFacultyLabel = (faculty: FacultyDirectoryEntry) =>
    `${faculty.displayName} • ${faculty.designation} • ${faculty.department} (${faculty.facultyCode})`;

  const handleFacultyInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { value } = e.target;
    setFacultyQuery(value);
    const match = facultyOptions.find(
      (faculty) => getFacultyLabel(faculty) === value
    );
    setForm((prev) => ({ ...prev, facultyId: match?.id ?? "" }));
    setError(null);
    setMessage(null);
  };

  const handleFacultyPick = (faculty: FacultyDirectoryEntry) => {
    const label = getFacultyLabel(faculty);
    setFacultyQuery(label);
    setForm((prev) => ({ ...prev, facultyId: faculty.id }));
    setIsFacultyOpen(false);
    setError(null);
    setMessage(null);
  };

  const filteredFacultyOptions = facultyOptions.filter((faculty) => {
    if (!facultyQuery.trim()) return true;
    const term = facultyQuery.toLowerCase();
    return (
      faculty.displayName.toLowerCase().includes(term) ||
      faculty.department.toLowerCase().includes(term) ||
      faculty.designation.toLowerCase().includes(term) ||
      faculty.facultyCode.toLowerCase().includes(term) ||
      faculty.email?.toLowerCase().includes(term)
    );
  });

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, draftFile: file }));
    setError(null);
    setMessage(null);
  };

  const removeFile = () => {
    setForm((prev) => ({ ...prev, draftFile: null }));
  };

  useEffect(() => {
    let isMounted = true;
    const loadFacultyDirectory = async () => {
      setFacultyLoading(true);
      setFacultyError(null);
      try {
        const profiles = await studentApi.listFacultyDirectory({ limit: 200 });
        if (isMounted) {
          setFacultyOptions(profiles);
        }
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
            ? (err as { message: string }).message
            : "Failed to load faculty directory.";
        if (isMounted) {
          setFacultyError(message);
        }
      } finally {
        if (isMounted) {
          setFacultyLoading(false);
        }
      }
    };

    loadFacultyDirectory();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.facultyId) {
      setError("Please select a faculty member from the list.");
      return;
    }

    if (!form.draftFile) {
      setError("Please upload a draft LoR file.");
      return;
    }

    setIsSubmitting(true);
    setCurrentStep(4);
    
    try {
      const { id } = await studentApi.createSubmission({
        facultyId: form.facultyId,
        deadline: form.deadline,
        purpose: form.purpose,
      });

      const fd = new FormData();
      fd.append("file", form.draftFile);
      await apiClient.post(
        `/api/files/upload-draft/${id}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage("LoR request created and draft uploaded successfully.");
      setForm({
        facultyId: "",
        purpose: "",
        deadline: "",
        draftFile: null,
      });
      setFacultyQuery("");
      setCurrentStep(1);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string"
          ? (err as { message: string }).message
          : "Failed to create LoR request.";
      setError(message);
      setCurrentStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (stepNumber: number): 'completed' | 'active' | 'pending' => {
    if (message) return 'completed';
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  return (
    <div className="lor-root">
      <div className="lor-header">
        <div className="lor-header-content">
          <h1 className="lor-title">Request Letter of Recommendation</h1>
          <p className="lor-subtitle">
            Submit your LoR request to faculty members for your university applications
          </p>
        </div>
        <div className="lor-help-chip">
          <FaInfoCircle />
          <span>Need Help?</span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="lor-steps-container">
        {steps.map((step, index) => (
          <div key={step.number} className="lor-step-wrapper">
            <div className={`lor-step ${getStepStatus(step.number)}`}>
              <div className="lor-step-indicator">
                <div className="lor-step-circle">
                  {getStepStatus(step.number) === 'completed' ? (
                    <FaCheckCircle />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="lor-step-info">
                  <span className="lor-step-number">Step {step.number}</span>
                  <h3 className="lor-step-title">{step.title}</h3>
                  <p className="lor-step-description">{step.description}</p>
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="lor-step-connector">
                <FaChevronRight />
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="lor-alert error">
          <FaExclamationCircle className="alert-icon" />
          <span>{error}</span>
        </div>
      )}
      
      {message && (
        <div className="lor-alert success">
          <FaCheckCircle className="alert-icon" />
          <div className="alert-content">
            <strong>{message}</strong>
            <p>Your request has been sent to the faculty member for review.</p>
          </div>
        </div>
      )}

      <form className="lor-form" onSubmit={handleSubmit}>
        {/* Faculty Selection Card */}
        <div className="lor-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">
                <FaUserGraduate />
              </div>
              <div>
                <h2 className="card-title">Faculty Information</h2>
                <p className="card-description">Select the faculty member you want to request a recommendation from</p>
              </div>
            </div>
            <div className="step-badge">Step 1</div>
          </div>
          
          <div className="lor-field">
            <label className="lor-label" htmlFor="facultyId">
              <FaUserGraduate className="label-icon" />
              Faculty Name
              <span className="required-mark">*</span>
            </label>
            <div className="lor-dropdown">
              <input
                id="facultyId"
                name="facultyId"
                type="text"
                className="lor-input"
                placeholder={
                  facultyLoading
                    ? "Loading faculty..."
                    : "Search and select a faculty member"
                }
                value={facultyQuery}
                onChange={handleFacultyInput}
                onFocus={() => setIsFacultyOpen(true)}
                onBlur={() => setTimeout(() => setIsFacultyOpen(false), 150)}
                required
                disabled={facultyLoading}
                autoComplete="off"
              />
              {isFacultyOpen && !facultyLoading && (
                <div className="lor-dropdown-menu" role="listbox">
                  {filteredFacultyOptions.length === 0 ? (
                    <div className="lor-dropdown-empty">
                      No matching faculty found
                    </div>
                  ) : (
                    filteredFacultyOptions.map((faculty) => (
                      <button
                        key={faculty.id}
                        type="button"
                        className="lor-dropdown-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFacultyPick(faculty)}
                      >
                        <span className="lor-dropdown-title">{faculty.displayName}</span>
                        <span className="lor-dropdown-subtitle">
                          {faculty.designation} • {faculty.department} ({faculty.facultyCode})
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {facultyError ? (
              <span className="field-hint error-text">
                <FaExclamationCircle className="hint-icon" />
                {facultyError}
              </span>
            ) : (
              <span className="field-hint">
                <FaInfoCircle className="hint-icon" />
                Start typing to filter the faculty list
              </span>
            )}
          </div>
        </div>

        {/* University & Deadline Card */}
        <div className="lor-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">
                <FaUniversity />
              </div>
              <div>
                <h2 className="card-title">Application Details</h2>
                <p className="card-description">Provide information about your university application</p>
              </div>
            </div>
            <div className="step-badge">Step 2</div>
          </div>

          <div className="lor-field">
            <label className="lor-label" htmlFor="deadline">
              <FaCalendarAlt className="label-icon" />
              Submission Deadline
              <span className="required-mark">*</span>
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

          <div className="lor-field">
            <label className="lor-label" htmlFor="purpose">
              <FaBullseye className="label-icon" />
              Purpose & Additional Comments
              <span className="required-mark">*</span>
            </label>
            <textarea
              id="purpose"
              name="purpose"
              rows={4}
              className="lor-textarea"
              placeholder="Describe the purpose of this recommendation letter and any specific points you'd like the faculty to highlight..."
              value={form.purpose}
              onChange={handleChange}
              required
            />
            <span className="field-hint">
              <FaInfoCircle className="hint-icon" />
              This information will be visible to the faculty member
            </span>
          </div>
        </div>

        {/* File Upload Card */}
        <div className="lor-card">
          <div className="card-header">
            <div className="card-header-left">
              <div className="card-icon">
                <FaFileUpload />
              </div>
              <div>
                <h2 className="card-title">Draft Letter Upload</h2>
                <p className="card-description">Upload your draft LoR for faculty review</p>
              </div>
            </div>
            <div className="step-badge">Step 3</div>
          </div>

          <div className="lor-upload-container">
            {!form.draftFile ? (
              <label htmlFor="draft" className="lor-upload-area">
                <input
                  id="draft"
                  name="draft"
                  type="file"
                  className="lor-file-input"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                <div className="lor-upload-content">
                  <FaCloudUploadAlt className="upload-icon" />
                  <div className="upload-text">
                    <p className="upload-primary">Click to upload or drag and drop</p>
                    <p className="upload-secondary">PDF, DOC, DOCX (MAX. 5MB)</p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="lor-file-preview">
                <div className="file-preview-content">
                  <FaFileAlt className="file-icon" />
                  <div className="file-info">
                    <p className="file-name">{form.draftFile.name}</p>
                    <p className="file-size">
                      {(form.draftFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove-btn"
                  onClick={removeFile}
                  aria-label="Remove file"
                >
                  <FaTimes />
                </button>
              </div>
            )}
          </div>

          <div className="lor-upload-hint">
            <FaInfoCircle className="hint-icon" />
            <span>Make sure your draft is well-formatted and includes all necessary details</span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="lor-actions">
          <div className="lor-actions-info">
            <FaInfoCircle className="info-icon" />
            <span>Review all information before submitting your request</span>
          </div>
          <button
            type="submit"
            className="lor-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="button-icon spinning" />
                Submitting Request...
              </>
            ) : (
              <>
                <FaPaperPlane className="button-icon" />
                Submit LoR Request
              </>
            )}
          </button>
        </div>
      </form>

      {/* Information Panel */}
      <div className="lor-info-panel">
        <div className="info-panel-header">
          <FaInfoCircle className="panel-icon" />
          <h3>Important Information</h3>
        </div>
        <ul className="info-panel-list">
          <li>Ensure you provide at least 2-3 weeks before the deadline</li>
          <li>Your draft should follow standard LoR formatting</li>
          <li>Faculty members will review and may request revisions</li>
          <li>You'll be notified once the LoR is ready</li>
        </ul>
      </div>
    </div>
  );
};