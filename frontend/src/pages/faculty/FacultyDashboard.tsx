// FacultyDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  FiSearch,
  FiChevronRight,
  FiAlertCircle,
  FiFileText,
} from "react-icons/fi";
import apiClient from "../../lib/apiClient";
import "./FacultyDashboard.css";

type SubmissionStatus =
  | "submitted"
  | "resubmission"
  | "approved"
  | "rejected"
  | "completed";

type FacultyFilterKey = "pending" | "resubmission" | "approved" | "completed" | "all";

interface SubmissionRow {
  id: string;
  studentId: string;
  facultyId: string;
  status: SubmissionStatus;
  deadline: string;
  universityName?: string;
  purpose?: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface ListSubmissionsResponse {
  status: "success";
  data: {
    submissions: SubmissionRow[];
    count: number;
  };
}

interface OutletCtx {
  activeFilter: FacultyFilterKey;
  location: ReturnType<typeof useLocation>;
}

const statusLabelMap: Record<SubmissionStatus, string> = {
  submitted: "Submitted",
  resubmission: "Needs resubmission",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
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

export const FacultyDashboard: React.FC = () => {
  const { activeFilter } = useOutletContext<OutletCtx>();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const statusFromFilter: SubmissionStatus | undefined = useMemo(() => {
    if (activeFilter === "pending") return "submitted";
    if (activeFilter === "resubmission") return "resubmission";
    if (activeFilter === "approved") return "approved";
    if (activeFilter === "completed") return "completed";
    return undefined;
  }, [activeFilter]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: Record<string, string> = {};
        if (statusFromFilter) params.status = statusFromFilter;

        const res = await apiClient.get<ListSubmissionsResponse>("/api/submissions", {
          params,
        });

        if (!mounted) return;
        setSubmissions(res.data.data.submissions);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(getErrorMessage(err, "Failed to load requests."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [statusFromFilter]);

  const handleSearchChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setSearch(e.target.value);
  };

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return submissions;

    return submissions.filter((s) => {
      const idMatch = s.id.toLowerCase().includes(q);
      const studentMatch = s.studentId.toLowerCase().includes(q);
      const universityMatch = (s.universityName || "").toLowerCase().includes(q);
      const purposeMatch = (s.purpose || "").toLowerCase().includes(q);
      return idMatch || studentMatch || universityMatch || purposeMatch;
    });
  }, [search, submissions]);

  const handleViewDetail = (id: string) => {
    navigate(`/faculty/requests/${id}`);
  };

  return (
    <div className="fd-root">
      <div className="fd-header">
        <div className="fd-header-main">
          <h1 className="fd-title">Requests overview</h1>
          <p className="fd-subtitle">
            Review and act on LoR submissions assigned to you. Use filters and search to
            narrow down to specific requests.
          </p>
        </div>
        <div className="fd-search-wrapper">
          <FiSearch className="fd-search-icon" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            className="fd-search-input"
            placeholder="Search by request ID, student ID, university, purpose…"
          />
        </div>
      </div>

      {loading && (
        <div className="fd-loading">
          <div className="fd-spinner" />
          <span className="fd-loading-text">Loading requests…</span>
        </div>
      )}

      {!loading && error && (
        <div className="fd-alert fd-alert-error">
          <FiAlertCircle className="fd-alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && filteredRows.length === 0 && (
        <div className="fd-empty">
          <div className="fd-empty-icon-wrapper">
            <FiFileText className="fd-empty-icon" />
          </div>
          <h2 className="fd-empty-title">No requests found</h2>
          <p className="fd-empty-text">
            There are no submissions matching the current filter and search criteria.
          </p>
        </div>
      )}

      {!loading && !error && filteredRows.length > 0 && (
        <div className="fd-card">
          <div className="fd-card-header">
            <div className="fd-card-title-block">
              <h2 className="fd-card-title">Assigned submissions</h2>
              <p className="fd-card-subtitle">
                Showing {filteredRows.length} of {submissions.length} request
                {submissions.length === 1 ? "" : "s"} for this filter.
              </p>
            </div>
            <span className="fd-card-filter-pill">
              {activeFilter === "pending"
                ? "Pending approvals"
                : activeFilter === "resubmission"
                ? "Resubmission required"
                : activeFilter === "approved"
                ? "Approved"
                : activeFilter === "completed"
                ? "Completed"
                : "All history"}
            </span>
          </div>

          <div className="fd-table-wrapper">
            <table className="fd-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Student</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((s) => (
                  <tr
                    key={s.id}
                    className="fd-row"
                    onClick={() => handleViewDetail(s.id)}
                  >
                    <td data-label="Request">
                      <div className="fd-cell-main">
                        <span className="fd-cell-title">
                          {s.universityName || "University not specified"}
                        </span>
                        <span className="fd-cell-sub">
                          {s.purpose || "No purpose provided"}
                        </span>
                        <span className="fd-cell-meta">
                          ID: <span className="fd-id-chip">{s.id}</span>
                        </span>
                      </div>
                    </td>
                    <td data-label="Student">
                      <span className="fd-cell-student">{s.studentId}</span>
                    </td>
                    <td data-label="Deadline">
                      <span className="fd-cell-deadline">
                        {new Date(s.deadline).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`fd-status fd-status-${s.status}`}>
                        {statusLabelMap[s.status]}
                      </span>
                    </td>
                    <td data-label="Version">
                      <span className="fd-version-chip">v{s.currentVersion}</span>
                    </td>
                    <td className="fd-cell-action">
                      <button
                        type="button"
                        className="fd-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(s.id);
                        }}
                      >
                        <span>Open</span>
                        <FiChevronRight className="fd-action-icon" />
                      </button>
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

export default FacultyDashboard;
