import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

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
            <div className="login-logo-circle">L</div>
            <div className="login-title-block">
              <h1 className="login-title">Prototype - MIT LOR System</h1>
              <p className="login-subtitle">
                This is a prototype solely for demo purposes.
              </p>
            </div>
          </div>
          <p className="login-description">
            Access your recommendation requests securely as a student, faculty,
            or admin. Sessions are protected with short-lived tokens and
            HttpOnly cookies.
          </p>
          <div className="login-description">
            <p style={{ margin: 0, fontWeight: 600 }}>Demo accounts</p>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>Student: rahul.sharma@mitmanipal.edu</li>
              <li>Faculty: dr.rajesh.kumar@mitmanipal.edu</li>
              <li>Dean: dean.varun.mehta@mitmanipal.edu</li>
              <li>Password: manipal123</li>
            </ul>
          </div>
        </div>

        <div className="login-right">
          <h2 className="login-heading">Sign in</h2>
          <p className="login-right-subtitle">
            Use your registered institutional email and password.
          </p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div className="login-alert" role="alert">
                {serverError}
              </div>
            )}

            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`login-input ${
                  formErrors.email ? "login-input-error" : ""
                }`}
                placeholder="you@college.edu"
                value={form.email}
                onChange={handleChange}
                required
              />
              {formErrors.email && (
                <p className="login-error-text">{formErrors.email}</p>
              )}
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>
              <div className="login-input-wrapper">
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
                  className={`login-password-toggle ${showPassword ? "active" : ""}`}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        fill="currentColor"
                        d="M12 5c5.05 0 8.27 4.1 9.35 6-.83 1.47-2.48 3.68-4.9 5.05l1.52 1.52C20.94 16.39 22.5 13.5 23 12c-.79-2.23-4.64-9-11-9-1.46 0-2.78.23-3.97.62l1.64 1.64C10.36 5.09 11.16 5 12 5Zm-9.78-.72L3.5 5.56C1.53 7.07.2 9.05 0 12c.79 2.23 4.64 9 11 9 2.2 0 4.12-.58 5.74-1.49l2.2 2.2 1.28-1.28L3.5 3 2.22 4.28ZM5.63 7.7l1.42 1.42A4.5 4.5 0 0 0 12 16.5c.6 0 1.18-.11 1.71-.31l1.5 1.5A6.48 6.48 0 0 1 12 19c-5.05 0-8.27-4.1-9.35-6 .64-1.14 1.73-2.62 3.0-3.75ZM9.5 12a2.5 2.5 0 0 0 3.95 2.02l-3.47-3.47c-.3.42-.48.93-.48 1.45Zm2.5-2.5c.51 0 1.03.16 1.45.48l-3.43 3.43c.32.32.77.59 1.48.59A2.5 2.5 0 0 0 12 9.5Z"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        fill="currentColor"
                        d="M12 5c6.36 0 10.21 6.77 11 9-.79 2.23-4.64 9-11 9S1.79 16.23 1 14c.79-2.23 4.64-9 11-9Zm0 2C7.34 7 4.6 11.35 3.2 14c1.4 2.65 4.14 7 8.8 7s7.4-4.35 8.8-7C19.4 11.35 16.66 7 12 7Zm0 2.5A4.5 4.5 0 1 1 7.5 14 4.5 4.5 0 0 1 12 9.5Zm0 2A2.5 2.5 0 1 0 14.5 14 2.5 2.5 0 0 0 12 11.5Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="login-error-text">{formErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in securely"}
            </button>

            <p className="login-footnote">
              By signing in you agree to institutional policies on data
              protection and appropriate use.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
