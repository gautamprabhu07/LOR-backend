import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studentApi } from "../../lib/studentApi";
import type { StudentProfile } from "../../lib/studentApi";
import "./StudentDashboard.css";

interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  certificatesCount: number;
  targetUniversities: number;
}

interface RecentRequest {
  _id: string;
  facultyName: string;
  status: string;
  submittedAt: string;
  university?: string;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    certificatesCount: 0,
    targetUniversities: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
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
          const certs = await studentApi.getCertificates();
          const targets = await studentApi.getTargets();
          
          // Mock requests data - replace with actual API call when available
          const mockRequests: RecentRequest[] = [];
          
          setStats({
            totalRequests: mockRequests.length,
            pendingRequests: mockRequests.filter((r) => r.status === "pending").length,
            approvedRequests: mockRequests.filter((r) => r.status === "approved").length,
            certificatesCount: certs.length,
            targetUniversities: targets.length,
          });
          
          setRecentRequests(mockRequests.slice(0, 5));
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

  const profileCompletion = React.useMemo(() => {
    if (!profile) return 0;
    let completed = 0;
    const total = 5;

    if (profile.registrationNumber) completed++;
    if (profile.userId) completed++;
    if (stats.certificatesCount > 0) completed++;
    if (stats.targetUniversities > 0) completed++;
    if (profile.employment?.status) completed++;

    return Math.round((completed / total) * 100);
  }, [profile, stats]);

  const displayName = profile?.registrationNumber || user?.userId || "Student";
  const greeting = `Welcome back, ${displayName}!`;

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

      {/* Quick Stats */}
      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.totalRequests}</span>
          <span className="dashboard-stat-label">Total Requests</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.pendingRequests}</span>
          <span className="dashboard-stat-label">Pending</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.approvedRequests}</span>
          <span className="dashboard-stat-label">Approved</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.certificatesCount}</span>
          <span className="dashboard-stat-label">Certificates</span>
        </div>
        <div className="dashboard-stat-card">
          <span className="dashboard-stat-value">{stats.targetUniversities}</span>
          <span className="dashboard-stat-label">Universities</span>
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

      {/* Quick Actions */}
      <section className="dashboard-actions">
        <h2 className="dashboard-actions-title">Quick Actions</h2>
        <div className="dashboard-actions-grid">
          <Link to="/student/apply-lor" className="dashboard-action-button">
            <span className="dashboard-action-icon">📝</span>
            <span className="dashboard-action-text">Apply for LoR</span>
          </Link>
          <Link to="/student/certificates" className="dashboard-action-button">
            <span className="dashboard-action-icon">🎓</span>
            <span className="dashboard-action-text">Upload Certificates</span>
          </Link>
          <Link to="/student/targets" className="dashboard-action-button">
            <span className="dashboard-action-icon">🎯</span>
            <span className="dashboard-action-text">Set Target Universities</span>
          </Link>
          <Link to="/student/employment" className="dashboard-action-button">
            <span className="dashboard-action-icon">💼</span>
            <span className="dashboard-action-text">Update Employment</span>
          </Link>
        </div>
      </section>

      {/* Recent Requests */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Recent Requests</h2>
        {recentRequests.length === 0 ? (
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
                <th>Faculty</th>
                <th>University</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((req) => (
                <tr key={req._id}>
                  <td>{req.facultyName}</td>
                  <td>{req.university || "N/A"}</td>
                  <td>
                    <span className={`dashboard-status-badge ${req.status}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {new Date(req.submittedAt).toLocaleDateString("en-US", {
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
