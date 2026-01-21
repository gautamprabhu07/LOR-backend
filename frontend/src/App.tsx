// App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

// Student
import { StudentLayout } from "./pages/student/StudentLayout";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentEmploymentPage } from "./pages/student/StudentEmploymentPage";
import { StudentTargetsPage } from "./pages/student/StudentTargetsPage";
import { StudentCertificatesPage } from "./pages/student/StudentCertificatesPage";
import { StudentCreateLorPage } from "./pages/student/StudentCreateLorPage";
import { StudentRequestsPage } from "./pages/student/StudentRequestsPage";
import { StudentRequestDetailPage } from "./pages/student/StudentRequestDetailPage";

// Faculty
import { FacultyLayout } from "./pages/faculty/FacultyLayout";
import { FacultyDashboard } from "./pages/faculty/FacultyDashboard";
import { FacultyRequestDetailPage } from "./pages/faculty/FacultyRequestDetailPage";

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Student area */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/" element={<Navigate to="/student" replace />} />
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="employment" element={<StudentEmploymentPage />} />
          <Route path="targets" element={<StudentTargetsPage />} />
          <Route path="certificates" element={<StudentCertificatesPage />} />
          <Route path="apply-lor" element={<StudentCreateLorPage />} />
          <Route path="requests" element={<StudentRequestsPage />} />
          <Route path="requests/:id" element={<StudentRequestDetailPage />} />
        </Route>
      </Route>

      {/* Faculty area */}
      <Route element={<ProtectedRoute allowedRoles={["faculty"]} />}>
        <Route path="/faculty" element={<FacultyLayout />}>
          {/* Main dashboard listing requests with sidebar filters */}
          <Route index element={<FacultyDashboard />} />
          <Route path="requests" element={<FacultyDashboard />} />
          {/* Detail route for a specific submission assigned to this faculty */}
          {/* Route can reuse a common detail page if you design it that way */}
          <Route
            path="requests/:id"
            element={<FacultyRequestDetailPage />}
          />
          {/* When you create a dedicated faculty detail page, swap the element above */}
          {/* <Route path="requests/:id" element={<FacultyRequestDetailPage />} /> */}
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
