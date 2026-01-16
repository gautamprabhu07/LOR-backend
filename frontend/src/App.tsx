import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { StudentLayout } from "./pages/student/StudentLayout";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { StudentEmploymentPage } from "./pages/student/StudentEmploymentPage";
import { StudentTargetsPage } from "./pages/student/StudentTargetsPage";
import { StudentCertificatesPage } from "./pages/student/StudentCertificatesPage";
import { StudentCreateLorPage } from "./pages/student/StudentCreateLorPage";
import { StudentRequestsPage } from "./pages/student/StudentRequestsPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={<ProtectedRoute allowedRoles={["student", "alumni"]} />}
      >
        <Route path="/" element={<Navigate to="/student" replace />} />
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="employment" element={<StudentEmploymentPage />} />
          <Route path="targets" element={<StudentTargetsPage />} />
          <Route path="certificates" element={<StudentCertificatesPage />} />
          <Route path="apply-lor" element={<StudentCreateLorPage />} />
          <Route path="requests" element={<StudentRequestsPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
