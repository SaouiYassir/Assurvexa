import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import "./Register.css";

const initialFormData = {
  first_name: "",
  last_name: "",
  username: "",
  CIN: "",
  adresse: "",
  email: "",
  phone: "",
  password: "",
  password_confirmation: "",
};

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setGeneralError("");
    setSuccessMessage("");
    setErrors({});

    try {
      const response = await api.post("/register", formData);

      setSuccessMessage(
        response.data?.message ||
          "Your account has been created successfully."
      );

      setFormData(initialFormData);

      navigate("/login");
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        setGeneralError(
          error.response?.data?.message ||
            "Unable to create your account. Please try again."
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
      <span className="register-field-error">
        {Array.isArray(error) ? error[0] : error}
      </span>
    );
  };

  const renderInput = (name, label, options = {}) => {
    const {
      type = "text",
      placeholder = "",
      autoComplete = "off",
      passwordToggle = false,
      showValue = false,
    } = options;

    return (
      <div className="register-field" key={name}>
        <label htmlFor={name}>{label}</label>

        <div className={`register-input-wrapper ${errors[name] ? "has-error" : ""}`}>
          <input
            id={name}
            name={name}
            type={
              passwordToggle
                ? showValue
                  ? "text"
                  : "password"
                : type
            }
            placeholder={placeholder}
            value={formData[name]}
            onChange={handleChange}
            autoComplete={autoComplete}
            required
            minLength={name.includes("password") ? 8 : undefined}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? `${name}-error` : undefined}
          />

          {passwordToggle && (
            <button
              type="button"
              className="password-toggle"
              onClick={() =>
                name === "password"
                  ? setShowPassword((prev) => !prev)
                  : setShowConfirmPassword((prev) => !prev)
              }
              aria-label={showValue ? "Hide password" : "Show password"}
            >
              {showValue ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          )}
        </div>

        {renderError(name)}
      </div>
    );
  };

  return (
    <main className="register-page">
      {/* Editorial Brand Panel */}
      <aside className="register-brand">
        <div className="register-brand-inner">
          <NavLink to="/" className="register-logo">
            ASSURVEXA<span>.</span>
          </NavLink>

          <div className="register-brand-content">
            <span className="register-brand-label">
              PRIVATE CLIENT SERVICES
            </span>

            <div className="register-brand-line" />

            <h2>
              Protection,
              <br />
              <em>crafted</em> with care.
            </h2>

            <p>
              A more considered approach to protecting what matters.
              Discover a personal insurance experience built around
              confidence, clarity and lasting relationships.
            </p>

            <div className="register-brand-feature">
              <div className="feature-icon">
                <ShieldCheck size={20} strokeWidth={1.5} />
              </div>

              <div>
                <strong>Private by design</strong>
                <span>Your information deserves the highest level of care.</span>
              </div>
            </div>
          </div>

          <div className="register-brand-footer">
            <span>ASSURVEXA PRIVATE CLIENTS</span>
            <span>EST. 2026</span>
          </div>
        </div>
      </aside>

      {/* Registration Section */}
      <section className="register-main">
        <div className="register-content">
          <header className="register-header">
            <span className="register-eyebrow">
              CREATE YOUR ACCOUNT
            </span>

            <h1>Begin your journey.</h1>

            <p>
              Create your private client account and take the first step
              towards a more personal insurance experience.
            </p>
          </header>

          {/* Feedback */}
          {generalError && (
            <div className="register-alert register-alert-error" role="alert">
              <span>!</span>
              <p>{generalError}</p>
            </div>
          )}

          {successMessage && (
            <div
              className="register-alert register-alert-success"
              role="status"
              aria-live="polite"
            >
              <CheckCircle2 size={21} />
              <div>
                <strong>Registration successful</strong>
                <p>{successMessage}</p>
                <small>Redirecting you to login...</small>
              </div>
            </div>
          )}

          <form className="register-form" onSubmit={handleSubmit}>
            {/* Personal Information */}
            <div className="register-section-heading">
              <span>01</span>
              <h3>Personal information</h3>
            </div>

            <div className="register-fields-grid">
              {renderInput("first_name", "FIRST NAME", {
                placeholder: "Your first name",
                autoComplete: "given-name",
              })}

              {renderInput("last_name", "LAST NAME", {
                placeholder: "Your last name",
                autoComplete: "family-name",
              })}

              {renderInput("username", "USERNAME", {
                placeholder: "Choose a username",
                autoComplete: "username",
              })}

              {renderInput("CIN", "NATIONAL ID (CIN)", {
                placeholder: "Your national ID",
              })}

              <div className="register-field full-width">
                {renderInput("adresse", "ADDRESS", {
                  placeholder: "Your residential address",
                  autoComplete: "street-address",
                })}
              </div>
            </div>

            {/* Contact Information */}
            <div className="register-section-heading">
              <span>02</span>
              <h3>Contact information</h3>
            </div>

            <div className="register-fields-grid">
              {renderInput("email", "EMAIL ADDRESS", {
                type: "email",
                placeholder: "name@example.com",
                autoComplete: "email",
              })}

              {renderInput("phone", "PHONE NUMBER", {
                type: "tel",
                placeholder: "+212 6XX XXX XXX",
                autoComplete: "tel",
              })}
            </div>

            {/* Security */}
            <div className="register-section-heading">
              <span>03</span>
              <h3>Account security</h3>
            </div>

            <div className="register-fields-grid">
              {renderInput("password", "PASSWORD", {
                placeholder: "Create a secure password",
                autoComplete: "new-password",
                passwordToggle: true,
                showValue: showPassword,
              })}

              {renderInput(
                "password_confirmation",
                "CONFIRM PASSWORD",
                {
                  placeholder: "Confirm your password",
                  autoComplete: "new-password",
                  passwordToggle: true,
                  showValue: showConfirmPassword,
                }
              )}
            </div>

            <div className="register-security-note">
              <ShieldCheck size={16} />
              <span>
                Your personal information is handled with care and
                confidentiality.
              </span>
            </div>

            <button
              type="submit"
              className="register-submit"
              disabled={loading || Boolean(successMessage)}
            >
              <span>
                {loading ? "CREATING YOUR ACCOUNT..." : "CREATE ACCOUNT"}
              </span>

              {!loading && <ArrowRight size={17} />}
              {loading && <span className="register-spinner" />}
            </button>
          </form>

          <footer className="register-footer">
            <p>
              Already have an account?
              <NavLink to="/login">Sign in <ArrowRight size={14} /></NavLink>
            </p>

            <span>© 2026 ASSURVEXA. ALL RIGHTS RESERVED.</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default Register;
