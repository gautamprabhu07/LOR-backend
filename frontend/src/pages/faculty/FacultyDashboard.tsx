// FacultyDashboard.tsx - Enhanced Professional Design
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  FiSearch,
  FiChevronRight,
  FiAlertCircle,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiRefreshCcw,
  FiLayers,
  FiUser,
  FiCalendar,
  FiTrendingUp,
  FiInbox,
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
  studentName?: string;
  studentEmail?: string;
  facultyId: string;
  status: SubmissionStatus;
  deadline: string;
  universityName?: string;
  purpose?: string;
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
  submitted: "Pending Review",
  resubmission: "Resubmission Required",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

const statusIconMap: Record<SubmissionStatus, React.ReactNode> = {
  submitted: <FiClock className="fd-status-icon" />,
  resubmission: <FiRefreshCcw className="fd-status-icon" />,
  approved: <FiCheckCircle className="fd-status-icon" />,
  rejected: <FiAlertCircle className="fd-status-icon" />,
  completed: <FiLayers className="fd-status-icon" />,
};

const filterDisplayMap: Record<FacultyFilterKey, { label: string; icon: React.ReactNode }> = {
  pending: { label: "Pending Approvals", icon: <FiClock /> },
  resubmission: { label: "Resubmission Required", icon: <FiRefreshCcw /> },
  approved: { label: "Approved Requests", icon: <FiCheckCircle /> },
  completed: { label: "Completed", icon: <FiLayers /> },
  all: { label: "All History", icon: <FiFileText /> },
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

const formatDeadline = (deadline: string): { text: string; isUrgent: boolean; daysLeft: number } => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const isUrgent = daysLeft <= 3 && daysLeft >= 0;
  
  const text = deadlineDate.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  
  return { text, isUrgent, daysLeft };
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
      const studentIdMatch = s.studentId.toLowerCase().includes(q);
      const studentNameMatch = (s.studentName || "").toLowerCase().includes(q);
      const studentEmailMatch = (s.studentEmail || "").toLowerCase().includes(q);
      const universityMatch = (s.universityName || "").toLowerCase().includes(q);
      const purposeMatch = (s.purpose || "").toLowerCase().includes(q);
      return (
        idMatch ||
        studentIdMatch ||
        studentNameMatch ||
        studentEmailMatch ||
        universityMatch ||
        purposeMatch
      );
    });
  }, [search, submissions]);

  const handleViewDetail = (id: string) => {
    navigate(`/faculty/requests/${id}`);
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter(s => s.status === "submitted").length;
    const resubmission = submissions.filter(s => s.status === "resubmission").length;
    const approved = submissions.filter(s => s.status === "approved").length;
    
    return { total, pending, resubmission, approved };
  }, [submissions]);

  const filterInfo = filterDisplayMap[activeFilter];

  return (
    <div className="fd-root">
      {/* Enhanced Header Section */}
      <div className="fd-header-section">
        <div className="fd-header-content">
          <div className="fd-header-main">
            <div className="fd-breadcrumb">
              <FiInbox className="fd-breadcrumb-icon" />
              <span className="fd-breadcrumb-text">Request Management</span>
            </div>
            <h1 className="fd-title">Letter of Recommendation Requests</h1>
            <p className="fd-subtitle">
              Review and manage LoR submissions assigned to you. Use filters and search to
              find specific requests quickly.
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="fd-stats-grid">
            <div className="fd-stat-card">
              <div className="fd-stat-icon-wrapper fd-stat-primary">
                <FiFileText className="fd-stat-icon" />
              </div>
              <div className="fd-stat-content">
                <span className="fd-stat-value">{stats.total}</span>
                <span className="fd-stat-label">Total Requests</span>
              </div>
            </div>

            <div className="fd-stat-card">
              <div className="fd-stat-icon-wrapper fd-stat-warning">
                <FiClock className="fd-stat-icon" />
              </div>
              <div className="fd-stat-content">
                <span className="fd-stat-value">{stats.pending}</span>
                <span className="fd-stat-label">Pending</span>
              </div>
            </div>

            <div className="fd-stat-card">
              <div className="fd-stat-icon-wrapper fd-stat-info">
                <FiRefreshCcw className="fd-stat-icon" />
              </div>
              <div className="fd-stat-content">
                <span className="fd-stat-value">{stats.resubmission}</span>
                <span className="fd-stat-label">Resubmission</span>
              </div>
            </div>

            <div className="fd-stat-card">
              <div className="fd-stat-icon-wrapper fd-stat-success">
                <FiCheckCircle className="fd-stat-icon" />
              </div>
              <div className="fd-stat-content">
                <span className="fd-stat-value">{stats.approved}</span>
                <span className="fd-stat-label">Approved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="fd-controls-bar">
          <div className="fd-active-filter">
            <div className="fd-filter-icon-wrapper">
              {filterInfo.icon}
            </div>
            <div className="fd-filter-text">
              <span className="fd-filter-label">Active Filter</span>
              <span className="fd-filter-value">{filterInfo.label}</span>
            </div>
          </div>

          <div className="fd-search-wrapper">
            <FiSearch className="fd-search-icon" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              className="fd-search-input"
              placeholder="Search by ID, student, university, or purpose..."
            />
            {search && (
              <button
                className="fd-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fd-loading-container">
          <div className="fd-loading">
            <div className="fd-spinner" />
            <div className="fd-loading-content">
              <span className="fd-loading-title">Loading requests</span>
              <span className="fd-loading-text">Please wait while we fetch your data...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="fd-alert fd-alert-error">
          <div className="fd-alert-icon-wrapper">
            <FiAlertCircle className="fd-alert-icon" />
          </div>
          <div className="fd-alert-content">
            <span className="fd-alert-title">Error Loading Requests</span>
            <span className="fd-alert-message">{error}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredRows.length === 0 && (
        <div className="fd-empty-state">
          <div className="fd-empty-icon-wrapper">
            <FiFileText className="fd-empty-icon" />
          </div>
          <h2 className="fd-empty-title">No Requests Found</h2>
          <p className="fd-empty-text">
            {search
              ? `No submissions match your search "${search}". Try adjusting your search terms.`
              : "There are no submissions matching the current filter criteria."}
          </p>
          {search && (
            <button className="fd-empty-action" onClick={() => setSearch("")}>
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Table Content */}
      {!loading && !error && filteredRows.length > 0 && (
        <div className="fd-content-card">
          <div className="fd-card-header">
            <div className="fd-card-title-section">
              <h2 className="fd-card-title">
                <FiTrendingUp className="fd-card-title-icon" />
                Assigned Submissions
              </h2>
              <p className="fd-card-subtitle">
                Showing <strong>{filteredRows.length}</strong> of{" "}
                <strong>{submissions.length}</strong> request
                {submissions.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="fd-table-container">
            <table className="fd-table">
              <thead>
                <tr>
                  <th className="fd-th-request">
                    <div className="fd-th-content">
                      <FiFileText className="fd-th-icon" />
                      Request ID
                    </div>
                  </th>
                  <th className="fd-th-student">
                    <div className="fd-th-content">
                      <FiUser className="fd-th-icon" />
                      Student
                    </div>
                  </th>
                  <th className="fd-th-deadline">
                    <div className="fd-th-content">
                      <FiCalendar className="fd-th-icon" />
                      Deadline
                    </div>
                  </th>
                  <th className="fd-th-status">Status</th>
                  <th className="fd-th-action">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((s) => {
                  const deadlineInfo = formatDeadline(s.deadline);
                  const studentName = s.studentName || "Student";
                  const studentEmail = s.studentEmail || "";
                  
                  return (
                    <tr
                      key={s.id}
                      className="fd-row"
                      onClick={() => handleViewDetail(s.id)}
                    >
                      <td data-label="Request">
                        <div className="fd-cell-request">
                          <span className="fd-request-id">{s.id}</span>
                        </div>
                      </td>
                      <td data-label="Student">
                        <div className="fd-cell-student">
                          <div className="fd-student-details">
                            <span className="fd-student-name">{studentName}</span>
                            <span className="fd-student-email">
                              {studentEmail || "Email unavailable"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Deadline">
                        <div className={`fd-cell-deadline ${deadlineInfo.isUrgent ? "fd-deadline-urgent" : ""}`}>
                          <FiCalendar className="fd-deadline-icon" />
                          <div className="fd-deadline-content">
                            <span className="fd-deadline-date">{deadlineInfo.text}</span>
                            {deadlineInfo.isUrgent && (
                              <span className="fd-deadline-badge">
                                {deadlineInfo.daysLeft === 0 ? "Today" : `${deadlineInfo.daysLeft}d left`}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="Status">
                        <div className={`fd-status fd-status-${s.status}`}>
                          {statusIconMap[s.status]}
                          <span className="fd-status-text">{statusLabelMap[s.status]}</span>
                        </div>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;