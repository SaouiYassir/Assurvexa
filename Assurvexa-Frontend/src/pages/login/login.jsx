import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import './login.css';

function Login() {
    const navigate = useNavigate();

    const [infos, setInfos] = useState({
        email: '',
        password: ''
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
            await api.post('/login', infos);
            navigate('/dashboard');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to sign in. Please check your credentials.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="login-page">

            {/* Left visual section */}
            <section className="login-visual">

                <div className="visual-content">
                    <span className="visual-tag">
                        PROTECTION, CRAFTED WITH CARE
                    </span>

                    <h1>
                        Your peace of mind
                        <br />
                        begins <em>here.</em>
                    </h1>

                    <p>
                        A more thoughtful approach to protecting
                        what matters most. Welcome to your private
                        insurance space.
                    </p>
                </div>

                <div className="visual-footer">
                    <span>INSURANCE, REIMAGINED.</span>
                    <span>© 2026 ASSURVEXA</span>
                </div>
            </section>

            {/* Right login section */}
            <section className="login-content">

                <div className="login-top">
                    <Link to="/" className="mobile-logo">
                        ASSURVEXA<span>.</span>
                    </Link>

                </div>

                <div className="login-form-wrapper">

                    <div className="login-heading">

                        <span className="login-subtitle">
                            PRIVATE CLIENT PORTAL
                        </span>

                        <h2>Welcome back.</h2>

                        <p>
                            Sign in to access your personal insurance
                            space and manage your protection.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {error && (
                            <div className="error-message" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email address</label>

                            <input
                                type="email"
                                name="email"
                                id="email"
                                placeholder="name@example.com"
                                value={infos.email}
                                onChange={handleChanges}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <div className="password-label">
                                <label htmlFor="password">Password</label>
                            </div>

                            <div className="password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    id="password"
                                    placeholder="Enter your password"
                                    value={infos.password}
                                    onChange={handleChanges}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword
                                        ? <EyeOff size={19} />
                                        : <Eye size={19} />
                                    }
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                            {!loading && <ArrowRight size={18} />}
                        </button>

                    </form>

                    <div className="login-security">
                        <span className="login-top-text">
                            New to Assurvexa?
                            <Link to="/register"> Create an account</Link>
                        </span>
                    </div>

                </div>

                <div className="login-bottom">
                    <span>© 2026 Assurvexa. All rights reserved.</span>
                    <Link to="/privacy">Privacy & Security</Link>
                </div>

            </section>

        </main>
    );
}

export default Login;
