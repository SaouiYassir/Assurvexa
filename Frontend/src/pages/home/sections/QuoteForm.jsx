import { useState } from 'react'
import './QuoteForm.css'

const INTEREST_OPTIONS = ['Home', 'Health', 'Life', 'Auto', 'Travel', 'Business']

function QuoteForm() {
  const [selectedInterests, setSelectedInterests] = useState(['Home'])
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    preferredContact: 'Email'
  })

  // Toggle selection for interest tags
  const toggleInterest = (option) => {
    setSelectedInterests((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Submitted Request:', { ...formData, interests: selectedInterests })
  }

  return (
    <form className="quote-form" onSubmit={handleSubmit}>
      {/* Interested In Section */}
      <div className="form-group">
        <label className="form-label">I AM INTERESTED IN</label>
        <div className="interest-tags">
          {INTEREST_OPTIONS.map((option) => {
            const isSelected = selectedInterests.includes(option)
            return (
              <button
                type="button"
                key={option}
                className={`tag-btn ${isSelected ? 'active' : ''}`}
                onClick={() => toggleInterest(option)}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      {/* Full Name Input */}
      <div className="form-group">
        <label htmlFor="fullName" className="form-label">FULL NAME</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          className="underline-input"
          value={formData.fullName}
          onChange={handleChange}
          required
        />
      </div>

      {/* Email Input */}
      <div className="form-group">
        <label htmlFor="email" className="form-label">EMAIL</label>
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

      {/* Preferred Contact Dropdown */}
      <div className="form-group">
        <label htmlFor="preferredContact" className="form-label">PREFERRED CONTACT</label>
        <div className="select-wrapper">
          <select
            id="preferredContact"
            name="preferredContact"
            className="underline-select"
            value={formData.preferredContact}
            onChange={handleChange}
          >
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <button type="submit" className="submit-btn">
        SEND REQUEST
      </button>
    </form>
  )
}

export default QuoteForm