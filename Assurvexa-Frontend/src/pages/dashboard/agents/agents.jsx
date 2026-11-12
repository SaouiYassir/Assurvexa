
import { useCallback, useEffect, useState } from 'react';
import api from '../../../services/api';
import './agents.css';

function Agents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConf, setShowPasswordConf] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        document.body.style.overflow = showForm ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [showForm]);

    const initialFormState = {
        first_name: '',
        last_name: '',
        username: '',
        CIN: '',
        phone: '',
        email: '',
        password: '',
        password_confirmation: ''
    };

    const [infos, setInfos] = useState(initialFormState);

    // Handle form inputs
    const handleChanges = (e) => {
        const { name, value } = e.target;

        setInfos(prev => ({
            ...prev,
            [name]: value
        }));

        setError('');
    };

    // Reset form
    const resetForm = () => {
        setInfos(initialFormState);
        setShowPassword(false);
        setShowPasswordConf(false);
        setError('');
    };

    // Fetch agents
    const getAgents = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/agents');

            const data =
                response.data?.data?.data ??
                response.data?.data ??
                response.data;

            setAgents(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error('Failed to fetch agents:', err);
            setError('Could not load agents data.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create agent
    const createAgent = async (e) => {
        e.preventDefault();

        // Password validation
        if (infos.password !== infos.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...infos,
                date_integration: new Date().toISOString().split('T')[0]
            };

            await api.post('/agents', payload);

            // Reset and close form
            resetForm();
            setShowForm(false);

            // Refresh agents list
            await getAgents();

            setSuccess('Agent created successfully.');

        } catch (err) {
            console.error('Failed to create agent:', err);

            const validationErrors = err.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors)[0]?.[0];
                setError(firstError || 'Please check the submitted information.');
            } else {
                setError(
                    err.response?.data?.message ||
                    'Could not create agent. Please try again.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel form
    const handleCancel = () => {
        resetForm();
        setShowForm(false);
    };

    // Initial data loading
    useEffect(() => {
        getAgents();
    }, [getAgents]);

    return (
        <main className="agents-container">

            {/* Header */}
            <div className="agents-header">
                <div>
                    <h1>Agents Management</h1>
                    <p>Manage your insurance agents.</p>
                </div>

                <button
                    className="btn-primary"
                    onClick={() => {
                        setShowForm(prev => !prev);
                        setError('');
                        setSuccess('');
                    }}
                >
                    {showForm ? 'Close form' : '+ Add agent'}
                </button>
            </div>

            {/* Feedback messages */}
            {error && (
                <div className="status-message error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="status-message success" role="status">
                    {success}
                </div>
            )}

            {/* Add Agent Form */}
            {showForm && (
                <div
                    className="modal-overlay"
                    onClick={handleCancel}
                >
                    <section
                        className="agent-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div>
                                <span className="eyebrow">ASSURVEXA TEAM</span>
                                <h2>Add new agent</h2>
                                <p>Create a new agent account.</p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={handleCancel}
                                aria-label="Close form"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Keep your existing form here */}
                        
                        <form onSubmit={createAgent} className="agent-form">

                            <div className="form-grid">

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
                                        placeholder="Username"
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
                                        placeholder="Enter CIN"
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

                                <div className="form-group">
                                    <label htmlFor="password">Password</label>

                                    <div className="password-wrapper">
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
                                            onClick={() => setShowPassword(prev => !prev)}
                                        >
                                            {showPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="password_confirmation">
                                        Confirm password
                                    </label>

                                    <div className="password-wrapper">
                                        <input
                                            type={showPasswordConf ? 'text' : 'password'}
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            placeholder="Re-enter password"
                                            value={infos.password_confirmation}
                                            onChange={handleChanges}
                                            autoComplete="new-password"
                                            minLength={8}
                                            required
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordConf(prev => !prev)}
                                        >
                                            {showPasswordConf ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </div>

                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCancel}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creating...' : 'Add agent'}
                                </button>
                            </div>

                        </form>

                    </section>
                </div>
            )}

            {/* Agents Table */}
            <section className="agents-table-section">

                {loading ? (
                    <div className="status-message">
                        Loading agents...
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="agents-table">

                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Date Integration</th>
                                    <th className="text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {agents.length > 0 ? (
                                    agents.map(agent => (
                                        <tr key={agent.id}>
                                            <td>#{agent.id}</td>

                                            <td className="font-weight-medium">
                                                {agent.user?.first_name}{' '}
                                                {agent.user?.last_name}
                                            </td>

                                            <td>
                                                {agent.user?.email || 'N/A'}
                                            </td>

                                            <td>
                                                {agent.date_integration
                                                    ? new Date(
                                                        agent.date_integration
                                                    ).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>

                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        type="button"
                                                        className="btn-icon btn-edit"
                                                        title="Edit agent (not implemented yet)"
                                                        disabled
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-icon btn-delete"
                                                        title="Delete agent (not implemented yet)"
                                                        disabled
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="no-data">
                                            No agents found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>
                )}

            </section>

        </main>
    );
}

export default Agents;
