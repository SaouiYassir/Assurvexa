import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../context/useAuth'
import './header.css'

const links = [
    { to: '/', label: 'Home' },
    { to: '/#cover', label: 'Insurance plans' },
    { to: '/#philosophy', label: 'Why Assurvexa' },
    { to: '/#quote', label: 'Contact Us' }
]

function Header() {
    const { isAuthenticated } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMenu();
    };

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <header>
            <NavLink 
                to="/" 
                className="logo" 
                aria-label="Assurvexa — Home" 
                onClick={scrollToTop}
            >
                Assurvexa
            </NavLink>

            <nav className={isMobileMenuOpen ? 'nav-open' : ''}>
                {links.map((element) => (
                    <a 
                        key={element.to} 
                        href={element.to} 
                        onClick={closeMenu}
                    >
                        {element.label}
                    </a>
                ))}

                <div className="mobile-auth">
                    {isAuthenticated ? (
                        <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
                    ) : (
                        <>
                            <NavLink to="/login" onClick={scrollToTop}>Login</NavLink>
                            <NavLink to="/register" onClick={scrollToTop} className="btn-get-started">Get started</NavLink>
                        </>
                    )}
                </div>
            </nav>

            <div className="authentication-part">
                {isAuthenticated ? (
                    <NavLink to="/dashboard" onClick={closeMenu}>Dashboard</NavLink>
                ) : (
                    <>
                        <NavLink to="/login" onClick={scrollToTop}>Login</NavLink>
                        <NavLink to="/register" onClick={scrollToTop} className="btn-get-started">Get started</NavLink>
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