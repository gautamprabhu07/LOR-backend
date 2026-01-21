// FacultyLayout.tsx - Enhanced Professional Design
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiLogOut,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiRefreshCcw,
  FiFileText,
  FiUser,
  FiBriefcase,
  FiMail,
} from "react-icons/fi";
import apiClient from "../../lib/apiClient";
import "./FacultyLayout.css";

type FacultyFilterKey =
  | "pending"
  | "resubmission"
  | "approved"
  | "completed"
  | "all";

interface FacultyProfileDTO {
  id: string;
  facultyCode: string;
  department: string;
  designation: string;
  name?: string;
  email?: string;
}

interface FacultyLayoutProps {
  onStatusFilterChange?: (status: FacultyFilterKey) => void;
}

/**
 * Layout for all /faculty routes.
 * Enhanced with professional design, smooth animations, and better UX
 */
export const FacultyLayout: React.FC<FacultyLayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FacultyFilterKey>("pending");
  const [profile, setProfile] = useState<FacultyProfileDTO | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await apiClient.get<{
          status: "success";
          data: FacultyProfileDTO;
        }>("/api/faculty/profile");
        if (!mounted) return;
        setProfile(res.data.data);
      } catch {
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSelectFilter = (key: FacultyFilterKey) => {
    setActiveFilter(key);
    const basePath = "/faculty/requests";
    const search = key === "all" ? "" : `?status=${key}`;
    navigate(`${basePath}${search}`);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // ignore logout failure, still navigate away
    } finally {
      navigate("/login");
    }
  };

  const initials =
    profile?.name?.charAt(0).toUpperCase() ||
    profile?.email?.charAt(0).toUpperCase() ||
    profile?.facultyCode?.charAt(0).toUpperCase() ||
    "F";

  const displayName =
    profile?.name || profile?.email?.split("@")[0] || profile?.facultyCode || "Faculty";

  const navItems: {
    key: FacultyFilterKey | "logout";
    label: string;
    icon: React.ReactNode;
    statusKey?: FacultyFilterKey;
    count?: number;
  }[] = [
    {
      key: "pending",
      label: "Pending Approvals",
      icon: <FiClock className="fl-nav-icon" />,
      statusKey: "pending",
    },
    {
      key: "resubmission",
      label: "Resubmission Required",
      icon: <FiRefreshCcw className="fl-nav-icon" />,
      statusKey: "resubmission",
    },
    {
      key: "approved",
      label: "Approved Requests",
      icon: <FiCheckCircle className="fl-nav-icon" />,
      statusKey: "approved",
    },
    {
      key: "completed",
      label: "Completed",
      icon: <FiLayers className="fl-nav-icon" />,
      statusKey: "completed",
    },
    {
      key: "all",
      label: "All History",
      icon: <FiFileText className="fl-nav-icon" />,
      statusKey: "all",
    },
  ];

  return (
    <div className="fl-shell">
      {/* Enhanced App Bar */}
      <header className="fl-appbar">
        <div className="fl-appbar-left">
          <button
            type="button"
            className="fl-appbar-icon-button"
            onClick={handleToggleSidebar}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <FiMenu className="fl-appbar-icon" />
          </button>

          <div className="fl-appbar-title">
            <span className="fl-appbar-title-main">LoR Management Portal</span>
            <span className="fl-appbar-title-sub">Faculty Workspace</span>
          </div>
        </div>

        <div className="fl-appbar-right">
          <div
            className="fl-appbar-profile"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            role="button"
            tabIndex={0}
          >
            <div className="fl-profile-info">
              <span className="fl-profile-name">
                {displayName}
              </span>
              <span className="fl-profile-meta">
                {loadingProfile ? (
                  <span className="fl-loading-pulse">Loading…</span>
                ) : (
                  <>
                    <FiBriefcase className="fl-meta-icon" />
                    {profile?.designation || "Faculty"} · {profile?.department || "Department"}
                  </>
                )}
              </span>
            </div>
            <div className="fl-profile-avatar" title={profile?.email || ""}>
              <span className="fl-avatar-text">{initials}</span>
              <div className="fl-avatar-status" />
            </div>
          </div>

          {profileMenuOpen && (
            <div className="fl-profile-dropdown">
              <div className="fl-dropdown-section">
                <div className="fl-dropdown-header">
                  <FiUser className="fl-dropdown-icon" />
                  <span>Profile Information</span>
                </div>
                <div className="fl-dropdown-item">
                  <span className="fl-dropdown-label">Faculty Code</span>
                  <span className="fl-dropdown-value">{profile?.facultyCode || "N/A"}</span>
                </div>
                <div className="fl-dropdown-item">
                  <span className="fl-dropdown-label">Department</span>
                  <span className="fl-dropdown-value">{profile?.department || "N/A"}</span>
                </div>
                {profile?.email && (
                  <div className="fl-dropdown-item">
                    <FiMail className="fl-dropdown-icon-sm" />
                    <span className="fl-dropdown-value">{profile.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="fl-main">
        {/* Enhanced Sidebar */}
        <aside
          className={`fl-sidebar ${sidebarOpen ? "fl-sidebar-open" : "fl-sidebar-collapsed"}`}
        >
          <div className="fl-sidebar-header">
            <span className="fl-sidebar-title">
              {sidebarOpen ? "Request Management" : "Req"}
            </span>
            {sidebarOpen && (
              <div className="fl-sidebar-subtitle">Filter by status</div>
            )}
          </div>

          <nav className="fl-nav">
            {navItems.map((item) => {
              const isActive = item.statusKey === activeFilter;

              const handleClick = () => {
                if (item.statusKey) {
                  handleSelectFilter(item.statusKey);
                }
              };

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`fl-nav-item ${isActive ? "fl-nav-item-active" : ""}`}
                  onClick={handleClick}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <span className="fl-nav-item-accent" />
                  <div className="fl-nav-item-content">
                    {item.icon}
                    {sidebarOpen && (
                      <span className="fl-nav-label">{item.label}</span>
                    )}
                  </div>
                  {isActive && <div className="fl-nav-item-indicator" />}
                </button>
              );
            })}

            {/* Divider */}
            <div className="fl-nav-divider" />

            {/* Logout Button */}
            <button
              type="button"
              className="fl-nav-item fl-nav-item-logout"
              onClick={handleLogout}
              title={!sidebarOpen ? "Logout" : undefined}
            >
              <span className="fl-nav-item-accent" />
              <div className="fl-nav-item-content">
                <FiLogOut className="fl-nav-icon" />
                {sidebarOpen && <span className="fl-nav-label">Logout</span>}
              </div>
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="fl-content">
          <Outlet context={{ activeFilter, location }} />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fl-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default FacultyLayout;