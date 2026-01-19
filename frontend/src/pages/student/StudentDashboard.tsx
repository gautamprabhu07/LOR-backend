import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studentApi } from "../../lib/studentApi";
import type {
  StudentProfile,
  ProfileCompletion,
} from "../../lib/studentApi";
import {
  FileText,
  Award,
  Target,
  Briefcase,
  AlertCircle,
  ArrowRight,
  Mail,
  Building2,
} from "lucide-react";
import "./StudentDashboard.css";

interface DashboardStats {
  totalRequests: number;
  certificatesCount: number;
  targetUniversities: number;
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    certificatesCount: 0,
    targetUniversities: 0,
  });
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
      ? "Not Set"
      : `${currentStatus.charAt(0).toUpperCase()}${currentStatus.slice(1)}`;

  if (loading) {
    return (
      <div className="dashboard-root">
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
          <span className="dashboard-loading-text">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-root">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-greeting">{greeting}</p>
          </div>
          <Link to="/student/apply-lor" className="dashboard-header-cta">
            <FileText size={18} strokeWidth={2} />
            <span>Apply for LoR</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Profile Completion Banner */}
      {profileCompletion < 100 && (
        <section className="dashboard-banner">
          <div className="dashboard-banner-icon">
            <AlertCircle size={20} />
          </div>
          <div className="dashboard-banner-content">
            <h3 className="dashboard-banner-title">Complete Your Profile</h3>
            <p className="dashboard-banner-text">
              Your profile is {profileCompletion}% complete. Complete it to unlock all features.
            </p>
          </div>
          <div className="dashboard-banner-progress">
            <div className="dashboard-banner-progress-bar">
              <div
                className="dashboard-banner-progress-fill"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <span className="dashboard-banner-progress-label">{profileCompletion}%</span>
          </div>
        </section>
      )}

      {/* Stats Grid */}
      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon requests">
            <FileText size={24} strokeWidth={2} />
          </div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{stats.totalRequests}</span>
            <span className="dashboard-stat-label">Total Requests</span>
          </div>
          <Link to="/student/requests" className="dashboard-stat-action">
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon certificates">
            <Award size={24} strokeWidth={2} />
          </div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{stats.certificatesCount}</span>
            <span className="dashboard-stat-label">Certificates</span>
          </div>
          <Link to="/student/certificates" className="dashboard-stat-action">
            Manage
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon universities">
            <Target size={24} strokeWidth={2} />
          </div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-value">{stats.targetUniversities}</span>
            <span className="dashboard-stat-label">Target Universities</span>
          </div>
          <Link to="/student/targets" className="dashboard-stat-action">
            View All
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon status">
            <Briefcase size={24} strokeWidth={2} />
          </div>
          <div className="dashboard-stat-content">
            <span className="dashboard-stat-label">Employment Status</span>
            <span className={`dashboard-status-chip ${currentStatus}`}>
              {currentStatusLabel}
            </span>
          </div>
          <Link to="/student/employment" className="dashboard-stat-action">
            Update
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="dashboard-quick-actions">
        <h2 className="dashboard-section-title">Quick Actions</h2>
        <div className="dashboard-action-grid">
          <Link to="/student/apply-lor" className="dashboard-action-card">
            <div className="dashboard-action-icon">
              <Mail size={20} />
            </div>
            <div className="dashboard-action-content">
              <h3 className="dashboard-action-title">Apply for LoR</h3>
              <p className="dashboard-action-desc">Submit a new recommendation request</p>
            </div>
            <ArrowRight size={16} className="dashboard-action-arrow" />
          </Link>

          <Link to="/student/targets" className="dashboard-action-card">
            <div className="dashboard-action-icon">
              <Building2 size={20} />
            </div>
            <div className="dashboard-action-content">
              <h3 className="dashboard-action-title">Target Universities</h3>
              <p className="dashboard-action-desc">Manage your university list</p>
            </div>
            <ArrowRight size={16} className="dashboard-action-arrow" />
          </Link>

          <Link to="/student/certificates" className="dashboard-action-card">
            <div className="dashboard-action-icon">
              <Award size={20} />
            </div>
            <div className="dashboard-action-content">
              <h3 className="dashboard-action-title">Add Certificate</h3>
              <p className="dashboard-action-desc">Upload your achievements</p>
            </div>
            <ArrowRight size={16} className="dashboard-action-arrow" />
          </Link>
        </div>
      </section>
    </div>
  );
};