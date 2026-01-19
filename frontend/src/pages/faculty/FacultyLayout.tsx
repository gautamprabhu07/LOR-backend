// FacultyLayout.tsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiCheckCircle,
  FiClock,
  FiLayers,
  FiRefreshCcw,
  FiFileText,
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
  email?: string;
}

interface FacultyLayoutProps {
  onStatusFilterChange?: (status: FacultyFilterKey) => void;
}

/**
 * Layout for all /faculty routes.
 * Holds sidebar filter state and passes it down with context or props (decide in your routing setup).
 */
export const FacultyLayout: React.FC<FacultyLayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FacultyFilterKey>("pending");
  const [profile, setProfile] = useState<FacultyProfileDTO | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
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
    // You can also push query param for filter awareness
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
    profile?.email?.charAt(0).toUpperCase() ||
    profile?.facultyCode?.charAt(0).toUpperCase() ||
    "F";

  const navItems: {
    key: FacultyFilterKey | "logout";
    label: string;
    icon: React.ReactNode;
    statusKey?: FacultyFilterKey;
  }[] = [
    {
      key: "pending",
      label: "Pending approvals",
      icon: <FiClock className="fl-nav-icon" />,
      statusKey: "pending",
    },
    {
      key: "resubmission",
      label: "Resubmission required",
      icon: <FiRefreshCcw className="fl-nav-icon" />,
      statusKey: "resubmission",
    },
    {
      key: "approved",
      label: "Approved",
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
      label: "All history",
      icon: <FiFileText className="fl-nav-icon" />,
      statusKey: "all",
    },
    {
      key: "logout",
      label: "Logout",
      icon: <FiLogOut className="fl-nav-icon" />,
    },
  ];

  return (
    <div className="fl-shell">
      <header className="fl-appbar">
        <button
          type="button"
          className="fl-appbar-icon-button"
          onClick={handleToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <FiX className="fl-appbar-icon" /> : <FiMenu className="fl-appbar-icon" />}
        </button>

        <div className="fl-appbar-title">
          <span className="fl-appbar-title-main">LoR Management Portal</span>
          <span className="fl-appbar-title-sub">Faculty workspace</span>
        </div>

        <div className="fl-appbar-profile">
          <div className="fl-profile-info">
            <span className="fl-profile-name">
              {profile?.email?.split("@")[0] || profile?.facultyCode || "Faculty"}
            </span>
            <span className="fl-profile-meta">
              {loadingProfile
                ? "Loading…"
                : `${profile?.designation || "Faculty"} · ${
                    profile?.department || "Department"
                  }`}
            </span>
          </div>
          <div className="fl-profile-avatar" title={profile?.email || ""}>
            {initials}
          </div>
        </div>
      </header>

      <div className="fl-main">
        <aside
          className={`fl-sidebar ${sidebarOpen ? "fl-sidebar-open" : "fl-sidebar-collapsed"}`}
        >
          <div className="fl-sidebar-header">
            <span className="fl-sidebar-title">
              {sidebarOpen ? "Requests" : "Req"}
            </span>
          </div>
          <nav className="fl-nav">
            {navItems.map((item) => {
              const isLogout = item.key === "logout";
              const isActive =
                !isLogout && item.statusKey === activeFilter;

              const handleClick = () => {
                if (isLogout) {
                  handleLogout();
                } else if (item.statusKey) {
                  handleSelectFilter(item.statusKey);
                }
              };

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`fl-nav-item ${
                    isLogout ? "fl-nav-item-logout" : ""
                  } ${isActive ? "fl-nav-item-active" : ""}`}
                  onClick={handleClick}
                >
                  <span className="fl-nav-item-accent" />
                  {item.icon}
                  {sidebarOpen && (
                    <span className="fl-nav-label">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="fl-content">
          {/* Outlet will render specific faculty pages like requests list */}
          <Outlet context={{ activeFilter, location }} />
        </main>
      </div>
    </div>
  );
};

export default FacultyLayout;
