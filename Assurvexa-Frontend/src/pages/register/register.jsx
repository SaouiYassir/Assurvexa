
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import './register.css';

function Register() {
    const navigate = useNavigate();

    const scroll = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const [infos, setInfos] = useState({
        first_name: '',
        last_name: '',
        username: '',
        CIN: '',
        adresse: '',
        phone: '',
        email: '',
        password: '',
        password_confirmation: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChanges = (e) => {
        const { name, value } = e.target;

        setInfos(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.post('/register', infos);
            navigate('/login');
        } catch (err) {
            const validationErrors = err.response?.data?.errors;

            setError(
                validationErrors
                    ? Object.values(validationErrors).flat().join(' ')
                    : err.response?.data?.message ||
                      'Unable to create your account. Please try again.'
            );
        } finally {
            setLoading(false);
            scroll();
        }
    };

    return (
        <main className="register-page">

            {/* Left visual section */}
            <section className="register-visual">

                <div className="visual-content">
                    <span className="visual-tag">
                        PROTECTION, CRAFTED WITH CARE
                    </span>

                    <h1>
                        A better way
                        <br />
                        to protect <em>life.</em>
                    </h1>

                    <p>
                        Your future deserves thoughtful protection.
                        Create your account and discover a more
                        personal insurance experience.
                    </p>
                </div>

                <div className="visual-footer">
                    <span>INSURANCE, REIMAGINED.</span>
                    <span>© 2026 ASSURVEXA</span>
                </div>

            </section>

            {/* Right registration section */}
            <section className="register-content">

                <div className="register-form-wrapper">

                    <div className="register-heading">
                        <span className="register-subtitle">
                            PRIVATE CLIENT PORTAL
                        </span>

                        <h2>Create your account.</h2>

                        <p>
                            Join Assurvexa and take the first step
                            towards a more thoughtful protection.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="register-fields">

                            <div className="form-group">
                                <label htmlFor="first_name">First name</label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    placeholder="First name"
                                    value={infos.first_name}
                                    onChange={handleChanges}
                                    autoComplete="given-name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="last_name">Last name</label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    placeholder="Last name"
                                    value={infos.last_name}
                                    onChange={handleChanges}
                                    autoComplete="family-name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Choose a username"
                                    value={infos.username}
                                    onChange={handleChanges}
                                    autoComplete="username"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="CIN">National ID (CIN)</label>
                                <input
                                    type="text"
                                    id="CIN"
                                    name="CIN"
                                    placeholder="Enter your CIN"
                                    value={infos.CIN}
                                    onChange={handleChanges}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="+212 6XX XXX XXX"
                                    value={infos.phone}
                                    onChange={handleChanges}
                                    autoComplete="tel"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    value={infos.email}
                                    onChange={handleChanges}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="adresse">Address</label>
                                <input
                                    type="text"
                                    id="adresse"
                                    name="adresse"
                                    placeholder="Your residential address"
                                    value={infos.adresse}
                                    onChange={handleChanges}
                                    autoComplete="street-address"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>

                                <div className="password-input">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        placeholder="Minimum 8 characters"
                                        value={infos.password}
                                        onChange={handleChanges}
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(prev => !prev)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword
                                            ? <EyeOff size={18} />
                                            : <Eye size={18} />
                                        }
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password_confirmation">
                                    Confirm password
                                </label>

                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    placeholder="Repeat your password"
                                    value={infos.password_confirmation}
                                    onChange={handleChanges}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </div>

                        </div>

                        <button
                            type="submit"
                            className="register-submit"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                            {!loading && <ArrowRight size={18} />}
                        </button>

                    </form>

                    <span className="register-top-text">
                        Already a member?
                        <Link to="/login" onClick={scroll}> Sign in</Link>
                    </span>
                </div>

                <div className="register-bottom">
                    <span>© 2026 Assurvexa. All rights reserved.</span>
                    <Link to="/privacy" onClick={scroll}>Privacy & Security</Link>
                </div>

            </section>

        </main>
    );
}

export default Register;
