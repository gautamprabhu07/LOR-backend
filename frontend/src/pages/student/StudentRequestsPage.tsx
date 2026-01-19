// StudentRequestsPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentApi } from "../../lib/studentApi";
import type { FacultyDirectoryEntry, StudentSubmission } from "../../lib/studentApi";
import {
  FiChevronRight,
  FiFileText,
  FiPlusCircle,
  FiRefreshCcw,
  FiFilter,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiClock,
  FiLayers,
} from "react-icons/fi";
import "./StudentRequestsPage.css";

const statusLabelMap: Record<string, string> = {
  submitted: "Submitted",
  resubmission: "Needs Resubmission",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const statusIconMap: Record<string, React.ReactNode> = {
  submitted: <FiClock className="sr-status-icon" />,
  resubmission: <FiAlertCircle className="sr-status-icon" />,
  approved: <FiCheckCircle className="sr-status-icon" />,
  rejected: <FiXCircle className="sr-status-icon" />,
  completed: <FiCheckCircle className="sr-status-icon" />,
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

export const StudentRequestsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<FacultyDirectoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "submitted" | "resubmission" | "approved" | "rejected" | "completed"
  >("all");

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const [data, faculty] = await Promise.all([
          studentApi.listMySubmissions(),
          studentApi.listFacultyDirectory({ limit: 500 }),
        ]);
        if (isMounted) {
          setSubmissions(data);
          setFacultyOptions(faculty);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message =
            err &&
            typeof err === "object" &&
            "message" in err &&
            typeof (err as { message?: unknown }).message === "string"
              ? (err as { message: string }).message
              : "Failed to load requests.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleViewDetails = (submissionId: string) => {
    navigate(`/student/requests/${submissionId}`);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    studentApi
      .listMySubmissions()
      .then((data) => setSubmissions(data))
      .catch((err: unknown) => {
        setError(getErrorMessage(err, "Failed to reload."));
      })
      .finally(() => setIsLoading(false));
  };

  const filteredSubmissions =
    filter === "all"
      ? submissions
      : submissions.filter((s) => s.status === filter);

  const getStatusCounts = () => {
    return {
      all: submissions.length,
      submitted: submissions.filter((s) => s.status === "submitted").length,
      resubmission: submissions.filter((s) => s.status === "resubmission").length,
      approved: submissions.filter((s) => s.status === "approved").length,
      completed: submissions.filter((s) => s.status === "completed").length,
      rejected: submissions.filter((s) => s.status === "rejected").length,
    };
  };

  const statusCounts = getStatusCounts();

  const facultyNameById = useMemo(() => {
    const map = new Map<string, string>();
    facultyOptions.forEach((faculty) => {
      map.set(faculty.id, faculty.displayName);
    });
    return map;
  }, [facultyOptions]);

  return (
    <div className="sr-root">
      <div className="sr-header">
        <div className="sr-header-content">
          <div className="sr-header-left">
            <div className="sr-title-row">
              <div className="sr-title-accent" />
              <h1 className="sr-title">Letter of Recommendation Requests</h1>
            </div>
            <p className="sr-subtitle">
              Manage and track your recommendation letter submissions with real-time status updates
            </p>
          </div>
          <div className="sr-header-actions">
            <button
              type="button"
              className="sr-icon-button"
              onClick={handleRefresh}
              aria-label="Refresh"
              title="Refresh requests"
            >
              <FiRefreshCcw className={`sr-icon ${isLoading ? "sr-icon-spin" : ""}`} />
            </button>
            <button
              type="button"
              className="sr-primary-button"
              onClick={() => navigate("/student/create-lor")}
            >
              <FiPlusCircle className="sr-btn-icon" />
              <span>New Request</span>
            </button>
          </div>
        </div>
      </div>

      <div className="sr-filters-section">
        <div className="sr-filter-header">
          <FiFilter className="sr-filter-icon" />
          <span className="sr-filter-label">Filter by Status</span>
        </div>
        <div className="sr-filter-chips">
          {[
            { key: "all", label: "All Requests", count: statusCounts.all },
            { key: "submitted", label: "Submitted", count: statusCounts.submitted },
            { key: "resubmission", label: "Resubmission", count: statusCounts.resubmission },
            { key: "approved", label: "Approved", count: statusCounts.approved },
            { key: "completed", label: "Completed", count: statusCounts.completed },
            { key: "rejected", label: "Rejected", count: statusCounts.rejected },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`sr-filter-chip ${
                filter === f.key ? "sr-filter-chip-active" : ""
              }`}
              onClick={() =>
                setFilter(
                  f.key as
                    | "all"
                    | "submitted"
                    | "resubmission"
                    | "approved"
                    | "rejected"
                    | "completed"
                )
              }
            >
              <span className="sr-chip-label">{f.label}</span>
              {f.count > 0 && <span className="sr-chip-count">{f.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="sr-loading">
          <div className="sr-spinner-wrapper">
            <div className="sr-spinner" />
          </div>
          <span className="sr-loading-text">Loading your requests…</span>
        </div>
      )}

      {!isLoading && error && (
        <div className="sr-alert sr-alert-error">
          <FiXCircle className="sr-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && filteredSubmissions.length === 0 && (
        <div className="sr-empty">
          <div className="sr-empty-icon-wrapper">
            <FiFileText className="sr-empty-icon" />
          </div>
          <h2 className="sr-empty-title">
            {filter === "all" ? "No requests yet" : `No ${statusLabelMap[filter]?.toLowerCase()} requests`}
          </h2>
          <p className="sr-empty-text">
            {filter === "all"
              ? "Create your first LoR request to get started. Your submissions will appear here with real-time status tracking."
              : "Try adjusting your filters to view other requests."}
          </p>
          {filter === "all" && (
            <button
              type="button"
              className="sr-primary-button"
              onClick={() => navigate("/student/create-lor")}
            >
              <FiPlusCircle className="sr-btn-icon" />
              <span>Create LoR Request</span>
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && filteredSubmissions.length > 0 && (
        <div className="sr-card">
          <div className="sr-card-header">
            <div className="sr-card-title-block">
              <h2 className="sr-card-title">
                <FiLayers className="sr-card-title-icon" />
                Request Overview
              </h2>
              <p className="sr-card-subtitle">
                Click on any request to view detailed timeline, faculty feedback, and uploaded documents
              </p>
            </div>
            <div className="sr-card-badge">
              {filteredSubmissions.length} {filteredSubmissions.length === 1 ? "Request" : "Requests"}
            </div>
          </div>

          <div className="sr-table-wrapper">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th className="sr-th-action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((s) => (
                  <tr
                    key={s.id}
                    className="sr-row"
                    onClick={() => handleViewDetails(s.id)}
                  >
                    <td data-label="Faculty">
                      <div className="sr-cell-main">
                        <span className="sr-cell-title">
                          {facultyNameById.get(s.facultyId) ||
                            "Faculty not specified"}
                        </span>
                        <span className="sr-cell-sub">
                          <FiCalendar className="sr-cell-sub-icon" />
                          Created{" "}
                          {new Date(s.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td data-label="Deadline">
                      <div className="sr-deadline-wrapper">
                        <FiCalendar className="sr-deadline-icon" />
                        <span className="sr-cell-deadline">
                          {new Date(s.deadline).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={`sr-status sr-status-${s.status}`}>
                        {statusIconMap[s.status]}
                        {statusLabelMap[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="sr-cell-action">
                      <div className="sr-row-action">
                        <span className="sr-row-action-text">View Details</span>
                        <FiChevronRight className="sr-row-action-icon" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};