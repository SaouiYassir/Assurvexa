import { useCallback, useEffect, useState } from 'react';
import api from '../../../services/api';
import './agents.css';

const INITIAL_FORM = {
    first_name: '',
    last_name: '',
    username: '',
    CIN: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: ''
};

function Agents() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [modal, setModal] = useState(null);
    const [selectedAgent, setSelectedAgent] = useState(null);

    const [infos, setInfos] = useState(INITIAL_FORM);

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConf, setShowPasswordConf] = useState(false);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = modal ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [modal]);

    // FETCH AGENTS
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

    useEffect(() => {
        getAgents();
    }, [getAgents]);

    // FORM HANDLING
    const handleChange = (e) => {
        const { name, value } = e.target;

        setInfos(prev => ({
            ...prev,
            [name]: value
        }));

        setError('');
    };

    const resetForm = () => {
        setInfos(INITIAL_FORM);
        setShowPassword(false);
        setShowPasswordConf(false);
    };

    const closeModal = () => {
        if (submitting) return;

        setModal(null);
        setSelectedAgent(null);
        resetForm();
        setError('');
    };

    // OPEN CREATE MODAL
    const openCreateModal = () => {
        resetForm();
        setSelectedAgent(null);
        setError('');
        setSuccess('');
        setModal('create');
    };

    // OPEN EDIT MODAL
    const openEditModal = (agent) => {
        setSelectedAgent(agent);

        setInfos({
            first_name: agent.user?.first_name ?? '',
            last_name: agent.user?.last_name ?? '',
            username: agent.user?.username ?? '',
            CIN: agent.user?.CIN ?? '',
            phone: agent.user?.phone ?? '',
            email: agent.user?.email ?? '',
            password: '',
            password_confirmation: ''
        });

        setError('');
        setSuccess('');
        setShowPassword(false);
        setShowPasswordConf(false);

        setModal('edit');
    };

    // CREATE AGENT
    const createAgent = async (e) => {
        e.preventDefault();

        if (infos.password !== infos.password_confirmation) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');

            const payload = {
                ...infos,
                date_integration: new Date().toISOString().split('T')[0]
            };

            await api.post('/agents', payload);

            setModal(null);
            resetForm();

            await getAgents();

            setSuccess('Agent created successfully.');

        } catch (err) {
            console.error('Failed to create agent:', err);

            const validationErrors = err.response?.data?.errors;

            if (validationErrors) {
                setError(
                    Object.values(validationErrors)
                        .flat()
                        .join(' ')
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    'Could not create agent.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // UPDATE AGENT
    const updateAgent = async (e) => {
        e.preventDefault();

        if (!selectedAgent) return;

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');

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

            setModal(null);
            setSelectedAgent(null);
            resetForm();

            await getAgents();

            setSuccess('Agent updated successfully.');

        } catch (err) {
            console.error('Failed to update agent:', err);

            const validationErrors = err.response?.data?.errors;

            if (validationErrors) {
                setError(
                    Object.values(validationErrors)
                        .flat()
                        .join(' ')
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

    // OPEN DELETE MODAL
    const openDeleteModal = (agent) => {
        setSelectedAgent(agent);
        setError('');
        setSuccess('');
        setModal('delete');
    };

    // DELETE AGENT
    const deleteAgent = async () => {
        if (!selectedAgent) return;

        try {
            setSubmitting(true);
            setError('');

            await api.delete(`/agents/${selectedAgent.id}`);

            setModal(null);
            setSelectedAgent(null);

            await getAgents();

            setSuccess('Agent deleted successfully.');

        } catch (err) {
            console.error('Failed to delete agent:', err);

            setError(
                err.response?.data?.message ||
                'Could not delete agent.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="agentsSection" id="agents-section">

            {/* HEADER */}
            <div className="agents-header">
                <div>
                    <h1>Agents Management</h1>
                    <p>Manage your insurance agents.</p>
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={openCreateModal}
                >
                    + Add Agent
                </button>
            </div>

            {/* FEEDBACK */}
            {!modal && error && (
                <div className="agents-alert error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="agents-alert success" role="status">
                    {success}
                </div>
            )}

            {/* AGENTS TABLE */}
            <div className="table-responsive">
                <table className="table-agents">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Date Integration</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="no-data">
                                    Loading agents...
                                </td>
                            </tr>
                        ) : agents.length > 0 ? (
                            agents.map(agent => (
                                <tr key={agent.id}>
                                    <td>#{agent.id}</td>

                                    <td>
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
                                                onClick={() => openEditModal(agent)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-icon btn-delete"
                                                onClick={() => openDeleteModal(agent)}
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

            {/* CREATE / EDIT MODAL */}
            {(modal === 'create' || modal === 'edit') && (
                <div
                    className="agent-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="agent-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="agent-modal-header">
                            <div>
                                <h2>
                                    {modal === 'create'
                                        ? 'Create an Agent'
                                        : 'Edit Agent'}
                                </h2>

                                <p>
                                    {modal === 'create'
                                        ? 'Create a new agent account.'
                                        : 'Update the agent account information.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={submitting}
                                aria-label="Close modal"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={
                            modal === 'create'
                                ? createAgent
                                : updateAgent
                        }>
                            <div className="agent-form-row">
                                <div className="agent-form-group">
                                    <label htmlFor="first_name">
                                        First Name
                                    </label>

                                    <input
                                        id="first_name"
                                        type="text"
                                        name="first_name"
                                        value={infos.first_name}
                                        onChange={handleChange}
                                        placeholder="Enter first name"
                                        autoComplete="given-name"
                                        required
                                    />
                                </div>

                                <div className="agent-form-group">
                                    <label htmlFor="last_name">
                                        Last Name
                                    </label>

                                    <input
                                        id="last_name"
                                        type="text"
                                        name="last_name"
                                        value={infos.last_name}
                                        onChange={handleChange}
                                        placeholder="Enter last name"
                                        autoComplete="family-name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="agent-form-row">
                                <div className="agent-form-group">
                                    <label htmlFor="username">
                                        Username
                                    </label>

                                    <input
                                        id="username"
                                        type="text"
                                        name="username"
                                        value={infos.username}
                                        onChange={handleChange}
                                        placeholder="Enter username"
                                        autoComplete="username"
                                        required
                                    />
                                </div>

                                <div className="agent-form-group">
                                    <label htmlFor="CIN">
                                        National ID (CIN)
                                    </label>

                                    <input
                                        id="CIN"
                                        type="text"
                                        name="CIN"
                                        value={infos.CIN}
                                        onChange={handleChange}
                                        placeholder="Enter CIN"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="agent-form-row">
                                <div className="agent-form-group">
                                    <label htmlFor="phone">
                                        Phone Number
                                    </label>

                                    <input
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={infos.phone}
                                        onChange={handleChange}
                                        placeholder="+212 6XX XXX XXX"
                                        autoComplete="tel"
                                        required
                                    />
                                </div>

                                <div className="agent-form-group">
                                    <label htmlFor="email">
                                        Email Address
                                    </label>

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={infos.email}
                                        onChange={handleChange}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                            </div>

                            {/* PASSWORD FIELDS - CREATE ONLY */}
                            {modal === 'create' && (
                                <>
                                    <div className="agent-form-row">
                                        <div className="agent-form-group">
                                            <label htmlFor="password">
                                                Password
                                            </label>

                                            <div className="agent-password-wrapper">
                                                <input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    value={infos.password}
                                                    onChange={handleChange}
                                                    placeholder="Minimum 8 characters"
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

                                        <div className="agent-form-group">
                                            <label htmlFor="password_confirmation">
                                                Confirm Password
                                            </label>

                                            <div className="agent-password-wrapper">
                                                <input
                                                    id="password_confirmation"
                                                    type={showPasswordConf ? 'text' : 'password'}
                                                    name="password_confirmation"
                                                    value={infos.password_confirmation}
                                                    onChange={handleChange}
                                                    placeholder="Re-enter password"
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
                                </>
                            )}

                            {error && (
                                <div className="agents-alert error" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="agent-modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeModal}
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
                                        ? 'Saving...'
                                        : modal === 'create'
                                            ? 'Create Agent'
                                            : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {modal === 'delete' && (
                <div
                    className="agent-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="agent-modal delete-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="agent-modal-header">
                            <div>
                                <h2>Delete Agent</h2>

                                <p>
                                    Are you sure you want to delete this agent?
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={submitting}
                                aria-label="Close modal"
                            >
                                &times;
                            </button>
                        </div>

                        {selectedAgent && (
                            <p className="delete-agent-name">
                                {selectedAgent.user?.first_name}{' '}
                                {selectedAgent.user?.last_name}
                            </p>
                        )}

                        {error && (
                            <div className="agents-alert error" role="alert">
                                {error}
                            </div>
                        )}

                        <div className="agent-modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={closeModal}
                                disabled={submitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-delete-confirm"
                                onClick={deleteAgent}
                                disabled={submitting}
                            >
                                {submitting ? 'Deleting...' : 'Delete Agent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}

export default Agents;
