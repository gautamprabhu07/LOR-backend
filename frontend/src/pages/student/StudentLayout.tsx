import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { studentApi } from "../../lib/studentApi";
import type { StudentProfile } from "../../lib/studentApi";
import "./StudentLayout.css";

export const StudentLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);

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

  return (
    <div className="student-root">
      <header className="student-navbar">
        <button
          type="button"
          className="student-nav-hamburger"
          onClick={() => setIsSidebarOpen((p) => !p)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <div className="student-nav-title">
          <span className="student-nav-project">LOR Portal</span>
        </div>

        <div className="student-nav-spacer" />

        <div className="student-nav-user">
          <div className="student-nav-avatar">{displayName.charAt(0)}</div>
          <div className="student-nav-user-text">
            <span className="student-nav-user-name">{displayName}</span>
            <span className="student-nav-user-email">{displayEmail}</span>
          </div>
        </div>
      </header>

      <div className="student-main">
        <aside
          className={`student-sidebar ${
            isSidebarOpen ? "student-sidebar-open" : "student-sidebar-collapsed"
          }`}
        >
          <nav className="student-sidebar-nav">
            <NavLink
              to="/student"
              end
              className={({ isActive }) =>
                "student-sidebar-link" +
                (isActive ? " student-sidebar-link-active" : "")
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/student/targets"
              className={({ isActive }) =>
                "student-sidebar-link" +
                (isActive ? " student-sidebar-link-active" : "")
              }
            >
              Update target universities
            </NavLink>
            <NavLink
              to="/student/certificates"
              className={({ isActive }) =>
                "student-sidebar-link" +
                (isActive ? " student-sidebar-link-active" : "")
              }
            >
              Update certificates
            </NavLink>
            <NavLink
              to="/student/employment"
              className={({ isActive }) =>
                "student-sidebar-link" +
                (isActive ? " student-sidebar-link-active" : "")
              }
            >
              Update employment status
            </NavLink>
            <NavLink
              to="/student/apply-lor"
              className={({ isActive }) =>
                "student-sidebar-link" +
                (isActive ? " student-sidebar-link-active" : "")
              }
            >
              Apply for LoR
            </NavLink>
            <NavLink
              to="/student/requests"
              className={({ isActive }) =>
                "student-sidebar-link" +
                (isActive ? " student-sidebar-link-active" : "")
              }
            >
              View my requests
            </NavLink>
          </nav>
          
          <div className="student-sidebar-footer">
            <button
              type="button"
              className="student-sidebar-logout"
              onClick={() => logout()}
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="student-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
