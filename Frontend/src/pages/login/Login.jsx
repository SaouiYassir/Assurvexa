import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";

import api from "../../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: null,
    }));

    setGeneralError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setGeneralError("");
    setErrors({});

    try {
      const response = await api.post("/login", formData);

      const { token, user } = response.data;

      // Store authentication information
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect after successful login
      navigate("/dashboard", { replace: true });

    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else if (error.response?.status === 401) {
        setGeneralError(
          error.response.data.message ||
            "Invalid email address or password."
        );
      } else {
        setGeneralError(
          error.response?.data?.message ||
            "Unable to sign in. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field) => {
    const error = errors[field];

    if (!error) return null;

    return (
      <span id={`${field}-error`} className="login-field-error">
        {Array.isArray(error) ? error[0] : error}
      </span>
    );
  };

  return (
    <main className="login-page">

      {/* =================================
          BRAND PANEL
      ================================= */}

      <aside className="login-brand">
        <div className="login-brand-inner">

          <NavLink to="/" className="login-logo">
            ASSURVEXA<span>.</span>
          </NavLink>

          <div className="login-brand-content">

            <span className="login-brand-label">
              ASSURVEXA PRIVATE CLIENTS
            </span>

            <div className="login-brand-line" />

            <h2>
              Confidence
              <br />
              begins with <em>trust.</em>
            </h2>

            <p>
              Your protection deserves a personal approach.
              Access your private client space to manage your
              coverage, review your policies and stay informed.
            </p>

            <div className="login-brand-feature">
              <div className="login-feature-icon">
                <ShieldCheck size={21} strokeWidth={1.5} />
              </div>

              <div>
                <strong>Protected access</strong>
                <span>
                  A private space designed around your peace of mind.
                </span>
              </div>
            </div>

          </div>

          <div className="login-brand-footer">
            <span>PRIVATE CLIENT EXPERIENCE</span>
            <span>EST. 2026</span>
          </div>

        </div>
      </aside>

      {/* =================================
          LOGIN FORM
      ================================= */}

      <section className="login-main">
        <div className="login-content">

          <header className="login-header">

            <div className="login-header-icon">
              <LockKeyhole size={22} strokeWidth={1.5} />
            </div>

            <span className="login-eyebrow">
              WELCOME BACK
            </span>

            <h1>Welcome back.</h1>

            <p>
              Sign in to access your personal insurance space
              and continue where you left off.
            </p>

          </header>

          {/* General Error */}

          {generalError && (
            <div className="login-alert login-alert-error" role="alert">
              <span>!</span>
              <p>{generalError}</p>
            </div>
          )}

          {/* Login Form */}

          <form className="login-form" onSubmit={handleSubmit}>

            {/* Email */}

            <div className="login-field">

              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <div className={`login-input-wrapper ${errors.email ? "has-error" : ""}`}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  required
                />
              </div>

              {renderError("email")}

            </div>

            {/* Password */}

            <div className="login-field">

              <div className="login-password-heading">
                <label htmlFor="password">
                  PASSWORD
                </label>
              </div>

              <div className={`login-input-wrapper ${errors.password ? "has-error" : ""}`}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

              {renderError("password")}

            </div>

            {/* Forgot Password */}

            {/* <div className="login-options">
              <NavLink to="/forgot-password">
                Forgot password?
              </NavLink>
            </div> */}

            {/* Submit */}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span>
                {loading ? "AUTHENTICATING..." : "SIGN IN"}
              </span>

              {!loading && <ArrowRight size={17} />}

              {loading && <span className="login-spinner" />}
            </button>

          </form>

          {/* Security Note */}

          <div className="login-security-note">
            <ShieldCheck size={17} />
            <span>
              Your session is secured with encrypted authentication.
            </span>
          </div>

          {/* Footer */}

          <footer className="login-footer">

            <p>
              New to Assurvexa?
              <NavLink to="/register">
                Create an account <ArrowRight size={14} />
              </NavLink>
            </p>

            <span>
              © 2026 ASSURVEXA. ALL RIGHTS RESERVED.
            </span>

          </footer>

        </div>
      </section>

    </main>
  );
}

export default Login;
