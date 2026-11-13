import { useCallback, useEffect, useState } from 'react';
import api from '../../../services/api';
import './agents.css';

function Agents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [addForm, setAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    const [updateForm, setUpdateForm] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConf, setShowPasswordConf] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const modalOpen = addForm || updateForm;
        document.body.style.overflow = modalOpen ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [addForm, updateForm]);

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
            setAddForm(false);

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

    // Delete agent
    const deleteAgent = async (id) => {
        if (!window.confirm("Are you sure you want to delete this agent?")) {
            return;
        }

        try {
            await api.delete(`/agents/${id}`);
            getAgents();
        } catch (err) {
            console.error("Failed to delete agent:", err);
            if (err.response && err.response.data) {
                console.error("Conflict details:", err.response.data);
            }
            setError("Could not delete agent.");
        }

    }

    // Modify agents info
    const modifyAgent = (agent) => {
        setSelectedAgent(agent);

        setInfos({
            first_name: agent.user?.first_name || '',
            last_name: agent.user?.last_name || '',
            username: agent.user?.username || '',
            CIN: agent.user?.CIN || '',
            phone: agent.user?.phone || '',
            email: agent.user?.email || '',
            password: '',
            password_confirmation: ''
        });

        setError('');
        setSuccess('');
        setShowPassword(false);
        setShowPasswordConf(false);

        setAddForm(false);
        setUpdateForm(true);
    };

    const updateAgent = async (e) => {
        e.preventDefault();

        if (!selectedAgent) return;

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                first_name: infos.first_name,
                last_name: infos.last_name,
                username: infos.username,
                CIN: infos.CIN,
                phone: infos.phone,
                email: infos.email
            };

            await api.patch(
                `/agents/${selectedAgent.id}`,
                payload
            );

            setUpdateForm(false);
            setSelectedAgent(null);
            resetForm();

            await getAgents();

            setSuccess('Agent updated successfully.');

        } catch (err) {
            console.error('Failed to update agent:', err);

            const validationErrors = err.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors)[0]?.[0];

                setError(
                    firstError || 'Please check the submitted information.'
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    'Could not update agent.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Cancel form
    const handleCancel = () => {
        resetForm();

        setAddForm(false);
        setUpdateForm(false);
        setSelectedAgent(null);
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
                        if (addForm || updateForm) {
                            handleCancel();
                            return;
                        }

                        resetForm();
                        setSelectedAgent(null);
                        setUpdateForm(false);
                        setAddForm(true);

                        setError('');
                        setSuccess('');
                    }}
                >
                    {addForm ? 'Close form' : '+ Add agent'}
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
            {(addForm || updateForm) && (
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

                                <h2>
                                    {updateForm ? 'Edit agent' : 'Add new agent'}
                                </h2>

                                <p>
                                    {updateForm
                                        ? 'Update the agent account information.'
                                        : 'Create a new agent account.'}
                                </p>
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
                        
                        <form onSubmit={updateForm ? updateAgent : createAgent} className="agent-form">

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

                                {!updateForm && ( <>
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
                                </>)}
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
                                    {submitting
                                        ? (updateForm ? 'Updating...' : 'Creating...')
                                        : (updateForm ? 'Save changes' : 'Add agent')}
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
                                                        onClick={() => modifyAgent(agent)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-icon btn-delete"
                                                        onClick={() => deleteAgent(agent.id)}
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