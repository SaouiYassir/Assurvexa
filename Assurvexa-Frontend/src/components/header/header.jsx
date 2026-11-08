import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import './header.css'

const links = [
    { to: '/', label: 'Home' },
    { to: '#cover', label: 'Insurance plans' },
    { to: '#philosophy', label: 'Why Assurvexa' },
    { to: '#quote', label: 'Contact Us' }
]

function Header() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scroll = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <header>
            <NavLink 
                to="/" 
                className="logo" 
                aria-label="Assurvexa — Home" 
                onClick={scroll}
            >
                Assurvexa
            </NavLink>

            <nav className={isMobileMenuOpen ? 'nav-open' : ''}>
                {links.map((element) => (
                    <a key={element.to} href={element.to} onClick={closeMenu}>
                        {element.label}
                    </a>
                ))}

                <div className="mobile-auth">
                    {isAuthenticated ? (
                        <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
                    ) : (
                        <>
                            <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
                            <NavLink to="/get-started" onClick={closeMenu} className="btn-get-started">Get started</NavLink>
                        </>
                    )}
                </div>
            </nav>

            <div className="authentication-part">
                {isAuthenticated ? (
                    <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
                ) : (
                    <>
                        <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
                        <NavLink to="/get-started" onClick={closeMenu}>Get started</NavLink>
                    </>
                )}
            </div>

            <button
                className="menu-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
            >
                {isMobileMenuOpen
                    ? <X size={24} strokeWidth={1.5} />
                    : <Menu size={24} strokeWidth={1.5} />
                }
            </button>
        </header>
    )
}

export default Header;