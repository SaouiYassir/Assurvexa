import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './Register.css'

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.')
      return
    }
    console.log('Register submitted:', formData)
  }

  return (
    <section className="register-split-page">
      {/* Left Column — Editorial Brand Panel */}
      <div className="register-left">
        <div className="left-content">
          <p className="brand-eyebrow">ASSURVEXA PRIVATE CLIENTS</p>
          <h2 className="brand-quote">
            “Bespoke financial stewardship, structured for generational legacy.”
          </h2>
          <p className="brand-caption">
            Create your client account to consult with dedicated coverage advisors and review confidential policy documentation.
          </p>
        </div>
      </div>

      {/* Right Column — Register Form */}
      <div className="register-right">
        <div className="register-container">
          <div className="register-header">
            <p className="register-eyebrow">NEW CLIENT</p>
            <h1 className="register-title">Request Access</h1>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            {/* First Name & Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  FIRST NAME
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="underline-input"
                  placeholder=" "
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  LAST NAME
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="underline-input"
                  placeholder=" "
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

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
                placeholder=" "
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Phone Number Field */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                PHONE NUMBER
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="underline-input"
                placeholder=" "
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                PASSWORD
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="underline-input"
                placeholder=" "
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="underline-input"
                placeholder=" "
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {/* Submit Action */}
            <button type="submit" className="register-btn">
              CREATE ACCOUNT
            </button>
          </form>

          {/* Footer Redirect */}
          <div className="register-footer">
            <p>
              Already registered?{' '}
              <NavLink to="/login" className="login-link">
                Login
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Register