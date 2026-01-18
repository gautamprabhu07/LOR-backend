import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studentApi } from "../../lib/studentApi";
import type {
  StudentProfile,
  StudentSubmission,
  ProfileCompletion,
} from "../../lib/studentApi";
import "./StudentDashboard.css";

interface DashboardStats {
  totalRequests: number;
  certificatesCount: number;
  targetUniversities: number;
}

const statusLabelMap: Record<string, string> = {
  submitted: "Submitted",
  resubmission: "Needs resubmission",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    certificatesCount: 0,
    targetUniversities: 0,
  });
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        // Load profile
        const profileData = await studentApi.getProfile();
        if (mounted) {
          setProfile(profileData);

          // Calculate stats
          const [certs, targets, requestData, completionData] = await Promise.all([
            studentApi.getCertificates(),
            studentApi.getTargets(),
            studentApi.listMySubmissions(),
            studentApi.getProfileCompletion(),
          ]);

          setStats({
            totalRequests: requestData.length,
            certificatesCount: certs.length,
            targetUniversities: targets.length,
          });

          setSubmissions(requestData);
          setCompletion(completionData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const profileCompletion = completion?.percentage ?? 0;

  const displayName = profile?.registrationNumber || user?.userId || "Student";
  const greeting = `Welcome back, ${displayName}!`;
  const currentStatus = profile?.employment?.status ?? "unavailable";
  const currentStatusLabel =
    currentStatus === "unavailable"
      ? "Not set"
      : `${currentStatus.charAt(0).toUpperCase()}${currentStatus.slice(1)}`;

  if (loading) {
    return (
      <div className="dashboard-root">
        <div className="dashboard-loading">
          <span className="dashboard-spinner"></span>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-greeting">{greeting}</p>
      </header>

      {/* Overview Cards */}
      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.totalRequests}</span>
          <span className="dashboard-stat-label">Requests</span>
          <Link to="/student/requests" className="dashboard-stat-action">
            Manage requests
          </Link>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.certificatesCount}</span>
          <span className="dashboard-stat-label">Certificates</span>
          <Link to="/student/certificates" className="dashboard-stat-action">
            Manage certificates
          </Link>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.targetUniversities}</span>
          <span className="dashboard-stat-label">Target Universities</span>
          <Link to="/student/targets" className="dashboard-stat-action">
            Manage target universities
          </Link>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">Current Status</span>
          <span className="dashboard-stat-label">{currentStatusLabel}</span>
          <span className={`dashboard-status-pill ${currentStatus}`}>
            {currentStatusLabel}
          </span>
        </div>
      </section>

      {/* Profile Completion */}
      <section className="dashboard-section">
        <div className="dashboard-progress-card">
          <h3 className="dashboard-progress-title">Profile Completion</h3>
          <div className="dashboard-progress-bar">
            <div
              className="dashboard-progress-fill"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <div className="dashboard-progress-text">
            <span>{profileCompletion}% Complete</span>
            <span>
              {profileCompletion < 100
                ? "Complete your profile to apply for LoRs"
                : "Profile complete!"}
            </span>
          </div>
        </div>
      </section>

      {/* Requests */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">My Requests</h2>
        {submissions.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">📭</div>
            <p className="dashboard-empty-message">
              No recommendation requests yet. Start by applying for your first LoR!
            </p>
            <Link to="/student/apply-lor" className="dashboard-empty-action">
              Apply for LoR
            </Link>
          </div>
        ) : (
          <table className="dashboard-recent-table">
            <thead>
              <tr>
                <th>University</th>
                <th>Purpose</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((req) => (
                <tr key={req.id}>
                  <td>{req.universityName || "—"}</td>
                  <td>{req.purpose || "—"}</td>
                  <td>
                    {new Date(req.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <span className={`dashboard-status-badge ${req.status}`}>
                      {statusLabelMap[req.status] ?? req.status}
                    </span>
                  </td>
                  <td>
                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
