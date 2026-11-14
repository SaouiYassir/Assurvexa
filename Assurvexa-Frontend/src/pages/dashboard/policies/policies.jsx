import api from '../../../services/api';
import { useState, useEffect, useCallback } from 'react';
import './policies.css';

const POLICY_TYPES = [
    { value: 'automobile', label: 'Automobile' },
    { value: 'habitation', label: 'Habitation' },
    { value: 'sante', label: 'Santé' },
    { value: 'vie', label: 'Vie' },
    { value: 'professionnelle', label: 'Professionnelle' },
    { value: 'voyage', label: 'Voyage' }
];

const INITIAL_FORM = {
    nom: '',
    description: '',
    type: '',
    prix: ''
};

function Policies() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [modal, setModal] = useState(null);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [policie, setPolicie] = useState(INITIAL_FORM);

    // READ
    const getPolicies = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/policies');

            const data =
                response.data?.data?.data ??
                response.data?.data ??
                response.data;

            setPolicies(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch policies:', err);
            setError('Could not load policies data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getPolicies();
    }, [getPolicies]);

    // FORM HANDLING
    const handleChange = (e) => {
        const { name, value } = e.target;

        setPolicie(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const openCreateModal = () => {
        setPolicie(INITIAL_FORM);
        setSelectedPolicy(null);
        setModal('create');
        setError('');
        setSuccess('');
    };

    const openEditModal = (policy) => {
        setSelectedPolicy(policy);

        setPolicie({
            nom: policy.nom ?? '',
            description: policy.description ?? '',
            type: policy.type ?? '',
            prix: policy.prix ?? ''
        });

        setModal('edit');
        setError('');
        setSuccess('');
    };

    const closeModal = () => {
        if (submitting) return;

        setModal(null);
        setSelectedPolicy(null);
        setPolicie(INITIAL_FORM);
        setError('');
    };

    // CREATE / UPDATE
    const addOrUpdatePolicy = async (e) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            setError('');
            setSuccess('');

            const payload = {
                ...policie,
                prix: Number(policie.prix)
            };

            if (modal === 'create') {
                await api.post('/policies', payload);
                setSuccess('Policy created successfully.');
            } else if (modal === 'edit') {
                await api.put(
                    `/policies/${selectedPolicy.id}`,
                    payload
                );
                setSuccess('Policy updated successfully.');
            }

            setModal(null);
            setPolicie(INITIAL_FORM);
            setSelectedPolicy(null);

            await getPolicies();
        } catch (err) {
            console.error('Failed to save policy:', err);

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
                    'Could not save the policy.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // OPEN DELETE CONFIRMATION
    const openDeleteModal = (policy) => {
        setSelectedPolicy(policy);
        setModal('delete');
        setError('');
    };

    // DELETE
    const deletePolicy = async () => {
        try {
            setSubmitting(true);
            setError('');

            await api.delete(`/policies/${selectedPolicy.id}`);

            setModal(null);
            setSelectedPolicy(null);

            await getPolicies();
            setSuccess('Policy deleted successfully.');
        } catch (err) {
            console.error('Failed to delete policy:', err);
            setError(
                err.response?.data?.message ||
                'Could not delete the policy.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="policiesSection" id="policies-section">

            {/* HEADER */}
            <div className="policies-header">
                <div>
                    <h1>Policies Management</h1>
                    <p>Manage your insurance policies.</p>
                </div>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={openCreateModal}
                >
                    + Add Policy
                </button>
            </div>

            {/* FEEDBACK */}
            {error && (
                <div className="policies-alert error">
                    {error}
                </div>
            )}

            {success && (
                <div className="policies-alert success">
                    {success}
                </div>
            )}

            {/* TABLE */}
            <div className="table-responsive">
                <table className="table-policies">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Price</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="no-data">
                                    Loading policies...
                                </td>
                            </tr>
                        ) : policies.length > 0 ? (
                            policies.map(policy => (
                                <tr key={policy.id}>
                                    <td>{policy.nom}</td>

                                    <td className="policy-description">
                                        {policy.description}
                                    </td>

                                    <td>
                                        <span className="policy-type">
                                            {policy.type}
                                        </span>
                                    </td>

                                    <td>
                                        {Number(policy.prix).toLocaleString()}
                                    </td>

                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                type="button"
                                                className="btn-icon btn-edit"
                                                onClick={() => openEditModal(policy)}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                className="btn-icon btn-delete"
                                                onClick={() => openDeleteModal(policy)}
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
                                    No policies found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* CREATE / EDIT MODAL */}
            {(modal === 'create' || modal === 'edit') && (
                <div
                    className="policy-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="policy-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="policy-modal-header">
                            <div>
                                <h2>
                                    {modal === 'create'
                                        ? 'Create a Policy'
                                        : 'Edit Policy'}
                                </h2>

                                <p>
                                    {modal === 'create'
                                        ? 'Add a new insurance policy.'
                                        : 'Update the policy information.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={submitting}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={addOrUpdatePolicy}>
                            <div className="policy-form-group">
                                <label htmlFor="nom">Policy Name</label>
                                <input
                                    id="nom"
                                    type="text"
                                    name="nom"
                                    value={policie.nom}
                                    onChange={handleChange}
                                    placeholder="Enter policy name"
                                    required
                                />
                            </div>

                            <div className="policy-form-group">
                                <label htmlFor="description">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={policie.description}
                                    onChange={handleChange}
                                    placeholder="Enter policy description"
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="policy-form-row">
                                <div className="policy-form-group">
                                    <label htmlFor="type">Policy Type</label>
                                    <select
                                        id="type"
                                        name="type"
                                        value={policie.type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled>
                                            Select a type
                                        </option>

                                        {POLICY_TYPES.map(type => (
                                            <option
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="policy-form-group">
                                    <label htmlFor="prix">Price</label>
                                    <input
                                        id="prix"
                                        type="number"
                                        name="prix"
                                        value={policie.prix}
                                        onChange={handleChange}
                                        placeholder="Enter price"
                                        min="0"
                                        step="0.01"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="policies-alert error">
                                    {error}
                                </div>
                            )}

                            <div className="policy-modal-actions">
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
                                            ? 'Create Policy'
                                            : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {modal === 'delete' && (
                <div
                    className="policy-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="policy-modal delete-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="policy-modal-header">
                            <div>
                                <h2>Delete Policy</h2>
                                <p>
                                    Are you sure you want to delete this policy?
                                </p>
                            </div>
                        </div>

                        {selectedPolicy && (
                            <p className="delete-policy-name">
                                {selectedPolicy.nom}
                            </p>
                        )}

                        {error && (
                            <div className="policies-alert error">
                                {error}
                            </div>
                        )}

                        <div className="policy-modal-actions">
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
                                onClick={deletePolicy}
                                disabled={submitting}
                            >
                                {submitting ? 'Deleting...' : 'Delete Policy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
}

export default Policies;
