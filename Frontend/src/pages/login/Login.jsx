import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './Login.css'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', formData)
  }

  return (
    <section className="login-split-page">
      {/* Left Column — Editorial / Brand Hero */}
      <div className="login-left">
        <div className="left-content">
          <p className="brand-eyebrow">ASSURVEXA CLIENT PORTAL</p>
          <h2 className="brand-quote">
            “Discretion, speed, and absolute clarity for your private wealth.”
          </h2>
          <p className="brand-caption">
            Manage your bespoke coverage, view policy details, or contact your dedicated advisor directly.
          </p>
        </div>
      </div>

      {/* Right Column — Login Form */}
      <div className="login-right">
        <div className="login-container">
          <div className="login-header">
            <p className="login-eyebrow">WELCOME BACK</p>
            <h1 className="login-title">Sign in</h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="underline-input"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password" className="form-label">
                  PASSWORD
                </label>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                className="underline-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Submit Action */}
            <button type="submit" className="login-btn">
              SIGN IN
            </button>
          </form>

          {/* Footer Redirect */}
          <div className="login-footer">
            <p>
              Don’t have an account?{' '}
              <NavLink to="/register" className="register-link">
                Create your account
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Login