import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studentApi } from "../../lib/studentApi";
import type { StudentProfile } from "../../lib/studentApi";
import {
  LayoutDashboard,
  Target,
  Award,
  Briefcase,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  GraduationCap,
  ChevronRight,
  User
} from "lucide-react";
import "./StudentLayout.css";

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await studentApi.getProfile();
        if (mounted) setProfile(data);
      } catch {
        // non‑fatal for layout
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName =
    profile?.registrationNumber || user?.userId.slice(0, 6).toUpperCase() || "Student";
  const displayEmail = profile
    ? `${profile.registrationNumber.toLowerCase()}@college.edu`
    : "student@college.edu";

  const navItems = [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/targets", label: "Target Universities", icon: Target },
    { to: "/student/certificates", label: "Certificates", icon: Award },
    { to: "/student/employment", label: "Employment Status", icon: Briefcase },
    { to: "/student/apply-lor", label: "Apply for LoR", icon: FileText },
    { to: "/student/requests", label: "My Requests", icon: FolderOpen },
  ];

  return (
    <div className="student-root">
      {/* Enhanced Header */}
      <header className="student-navbar">
        <div className="student-nav-left">
          <button
            type="button"
            className="student-nav-hamburger"
            onClick={() => setIsSidebarOpen((p) => !p)}
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>

          <div className="student-nav-title">
            <div className="student-nav-logo">
              <GraduationCap size={22} strokeWidth={2.5} />
            </div>
            <div className="student-nav-brand">
              <span className="student-nav-project">LoR Portal</span>
              <span className="student-nav-subtitle">Student Dashboard</span>
            </div>
          </div>
        </div>

        <div className="student-nav-right">
          <div
            className="student-nav-user"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="student-nav-avatar">
              <span className="student-nav-avatar-text">{displayName.charAt(0)}</span>
              <div className="student-nav-avatar-status"></div>
            </div>
            <div className="student-nav-user-text">
              <span className="student-nav-user-name">{displayName}</span>
              <span className="student-nav-user-email">{displayEmail}</span>
            </div>
            <ChevronRight size={16} className={`student-nav-user-arrow ${showUserMenu ? 'rotated' : ''}`} />
          </div>

          {showUserMenu && (
            <div className="student-user-dropdown">
              <button className="student-dropdown-item">
                <User size={16} />
                <span>Profile</span>
              </button>
              <div className="student-dropdown-divider"></div>
              <button className="student-dropdown-item logout" onClick={() => logout()}>
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="student-main">
        {/* Enhanced Sidebar */}
        <aside
          className={`student-sidebar ${
            isSidebarOpen ? "student-sidebar-open" : "student-sidebar-collapsed"
          }`}
        >
          <nav className="student-sidebar-nav">
            {navItems.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `student-sidebar-link ${isActive ? "student-sidebar-link-active" : ""}`
                }
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="student-sidebar-link-content">
                  <div className="student-sidebar-icon">
                    <item.icon size={20} strokeWidth={2} />
                  </div>
                  <span className="student-sidebar-label">{item.label}</span>
                </div>
                <ChevronRight size={16} className="student-sidebar-arrow" />
              </NavLink>
            ))}
          </nav>

          <div className="student-sidebar-footer">
            <button
              type="button"
              className="student-sidebar-logout"
              onClick={() => logout()}
            >
              <LogOut size={18} strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="student-overlay"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};