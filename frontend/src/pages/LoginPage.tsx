import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Shield, 
  CheckCircle,
  AlertCircle 
} from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid institutional email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LoginFormData, string>>>(
    {}
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Client-side validation using Zod
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field === "email" || field === "password") {
          fieldErrors[field] = issue.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const user = await login(form.email, form.password);

      const targetPath =
        user.role === "faculty"
          ? "/faculty"
          : user.role === "student"
          ? "/student"
          : user.role === "admin"
          ? "/admin"
          : "/";

      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err !== null && "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
          ? (err as { message?: string }).message
          : undefined;
      const msg =
        message === "Invalid credentials"
          ? "Invalid email or password"
          : message || "Login failed. Please try again.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-left">
          <div className="login-brand">
            <div className="login-logo-circle">
              <GraduationCap size={28} strokeWidth={2.5} />
            </div>
            <div className="login-title-block">
              <h1 className="login-title">MIT LOR System</h1>
              <p className="login-subtitle">Prototype Demo Portal</p>
            </div>
          </div>

          <div className="login-features">
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <Shield size={18} />
              </div>
              <div className="login-feature-text">
                <h3>Secure Authentication</h3>
                <p>Protected with HttpOnly cookies and JWT tokens</p>
              </div>
            </div>
            <div className="login-feature-item">
              <div className="login-feature-icon">
                <CheckCircle size={18} />
              </div>
              <div className="login-feature-text">
                <h3>Role-Based Access</h3>
                <p>Tailored dashboards for students, faculty, and admins</p>
              </div>
            </div>
          </div>

          <div className="login-demo-accounts">
            <h3 className="login-demo-title">Demo Accounts</h3>
            <div className="login-demo-list">
              <div className="login-demo-item">
                <span className="login-demo-role student">Student</span>
                <span className="login-demo-email">rahul.sharma@mitmanipal.edu</span>
              </div>
              <div className="login-demo-item">
                <span className="login-demo-role faculty">Faculty</span>
                <span className="login-demo-email">dr.rajesh.kumar@mitmanipal.edu</span>
              </div>
              <div className="login-demo-item">
                <span className="login-demo-role admin">Dean</span>
                <span className="login-demo-email">dean.varun.mehta@mitmanipal.edu</span>
              </div>
              <div className="login-demo-password">
                <Lock size={12} />
                <span>Password: manipal123</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-right-header">
            <h2 className="login-heading">Welcome Back</h2>
            <p className="login-right-subtitle">
              Sign in with your institutional credentials
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div className="login-alert error" role="alert">
                <AlertCircle size={16} />
                <span>{serverError}</span>
              </div>
            )}

            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`login-input ${
                    formErrors.email ? "login-input-error" : ""
                  }`}
                  placeholder="your.name@institution.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {formErrors.email && (
                <p className="login-error-text">
                  <AlertCircle size={12} />
                  {formErrors.email}
                </p>
              )}
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>
              <div className="login-input-wrapper">
                <div className="login-input-icon">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`login-input ${
                    formErrors.password ? "login-input-error" : ""
                  }`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="login-error-text">
                  <AlertCircle size={12} />
                  {formErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="login-button-spinner"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Sign In Securely
                </>
              )}
            </button>

            <p className="login-footnote">
              By signing in, you agree to institutional policies on data protection and appropriate use.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};