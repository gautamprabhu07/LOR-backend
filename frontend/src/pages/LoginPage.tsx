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
      await login(form.email, form.password);

      // Redirect based on role later; for now, simple default dashboard
      navigate("/", { replace: true });
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
              <h1 className="login-title">LOR Portal</h1>
              <p className="login-subtitle">Secure Recommendation Management</p>
            </div>
          </div>
          <p className="login-description">
            Access your recommendation requests securely as a student, faculty,
            or admin. Sessions are protected with short-lived tokens and
            HttpOnly cookies.
          </p>
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
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className={`login-input ${
                  formErrors.password ? "login-input-error" : ""
                }`}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
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
