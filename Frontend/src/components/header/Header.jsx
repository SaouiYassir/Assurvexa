
import { useEffect, useId, useState } from 'react'
import { NavLink } from 'react-router-dom'
import './Header.css'

const links = [
  { to: '/', label: 'Home' },
  { to: '/#plans', label: 'Insurance plans' },
  { to: '/#about', label: 'Why Assurvexa' },
  { to: '/#reviews', label: 'Reviews' },
]

function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleNavigation = () => {
    setIsOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderNavItems = () =>
    links.map(({ to, label }) => (
      <NavLink
        key={to}
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          isActive && to === '/' ? 'active' : undefined
        }
        onClick={handleNavigation}
      >
        {label}
      </NavLink>
    ))

  const renderAuthButtons = () => (
    <div className="auth-buttons">
      <NavLink
        to="/login"
        className="btn-login"
        onClick={() => setIsOpen(false)}
      >
        Login
      </NavLink>

      <NavLink
        to="/register"
        className="btn-register"
        onClick={() => setIsOpen(false)}
      >
        Get started
      </NavLink>
    </div>
  )

  return (
    <header className="header">
      <NavLink
        to="/"
        className="logo"
        aria-label="Assurvexa — Home"
        onClick={handleNavigation}
      >
        Assurvexa<span className="logo-dot">.</span>
      </NavLink>

      <nav className="nav-links" aria-label="Main navigation">
        {renderNavItems()}
      </nav>

      {renderAuthButtons()}

      <button
        type="button"
        className={`hamburger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      <nav
        id={menuId}
        className={`nav ${isOpen ? 'active' : ''}`}
        aria-label="Mobile navigation"
        inert={!isOpen}
      >
        {renderNavItems()}
        {renderAuthButtons()}
      </nav>
    </header>
  )
}

export default Header
