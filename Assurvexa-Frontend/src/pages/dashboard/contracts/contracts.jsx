import { useDashboardRecords, useRecordPage } from '../useDashboardRecords';
import RecordPagination from '../RecordPagination';
import { useAuth } from '../../../context/useAuth';
import RecordSelect from '../RecordSelect';
import api from '../../../services/api';
import { can } from '../../../services/permissions';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search,
    RefreshCw,
    Eye,
    Plus,
    Pencil,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    X,
    Trash2,
    ShieldCheck
} from 'lucide-react';

import './contracts.css';

const INITIAL_CONTRACT_FORM = {
    customer_id: '',
    policy_id: '',
    date_debut: '',
    date_fin: '',
    status: 'active',
};

const normalizeStatus = (status) =>
    String(status || 'unknown').toLowerCase();

const isExpired = (contract) => {
    if (normalizeStatus(contract.status) === 'expired') return true;
    if (!contract.date_fin) return false;

    const endDate = new Date(`${contract.date_fin.slice(0, 10)}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        endDate < today &&
        !['cancelled', 'canceled', 'terminated', 'rejected'].includes(
            normalizeStatus(contract.status)
        )
    );
};

function Contracts({ role: propRole }) {
    const { user } = useAuth();
    const role = propRole ?? user?.role;

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [selectedContract, setSelectedContract] = useState(null);
    const [formModal, setFormModal] = useState(null); // 'create' | 'edit' | null
    const [contractForm, setContractForm] = useState(INITIAL_CONTRACT_FORM);
    const [validationErrors, setValidationErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Lock body scroll when any modal is open
    const isAnyModalOpen = Boolean(selectedContract || formModal);
    useEffect(() => {
        document.body.style.overflow = isAnyModalOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isAnyModalOpen]);

    // Role permissions (Agent: create/update/delete; Admin & Customer: view-only)
    const isAgent = role === 'agent';
    const canCreate = isAgent && can(role, 'contracts', 'create');
    const canUpdate = isAgent && can(role, 'contracts', 'update');
    const canDelete = isAgent && can(role, 'contracts', 'delete');

    // =====================================
    // FETCH CONTRACTS
    // =====================================

    const { records: contracts, loading, reload: getContracts } =
      useDashboardRecords('/contracts', setError);

    // =====================================
    // STATUS HELPERS
    // =====================================

    const getStatusClass = (status) => {
        const value = normalizeStatus(status);
        if (['active', 'approved', 'valid'].includes(value)) return 'active';
        if (['pending', 'in_progress'].includes(value)) return 'pending';
        if (['expired'].includes(value)) return 'expired';
        if (['cancelled', 'canceled', 'terminated', 'rejected'].includes(value)) {
            return 'cancelled';
        }
        return 'unknown';
    };

    const formatStatus = (status) =>
        String(status || 'Unknown')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());

    // =====================================
    // STATISTICS
    // =====================================

    const stats = useMemo(() => ({
        total: contracts.length,
        active: contracts.filter(
            contract =>
                ['active', 'approved', 'valid'].includes(
                    normalizeStatus(contract.status)
                ) && !isExpired(contract)
        ).length,
        pending: contracts.filter(
            contract => normalizeStatus(contract.status) === 'pending'
        ).length,
        expired: contracts.filter(contract => isExpired(contract)).length,
    }), [contracts]);

    // =====================================
    // SEARCH AND FILTER
    // =====================================

    const filteredContracts = useMemo(() => {
        return contracts.filter(contract => {
            const customer = contract.customer?.user;
            const agent = contract.agent?.user;
            const policy = contract.policy;

            const customerName = `${customer?.first_name || ''} ${customer?.last_name || ''}`;
            const agentName = `${agent?.first_name || ''} ${agent?.last_name || ''}`;
            const searchValue = search.toLowerCase();

            const matchesSearch =
                String(contract.id).includes(searchValue) ||
                customerName.toLowerCase().includes(searchValue) ||
                agentName.toLowerCase().includes(searchValue) ||
                String(policy?.nom || '').toLowerCase().includes(searchValue);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'expired'
                    ? isExpired(contract)
                    : normalizeStatus(contract.status) === statusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [contracts, search, statusFilter]);

    // =====================================
    // FORMATTERS
    // =====================================

    const formatDate = (date) => {
        if (!date) return '—';
        const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);
        if (Number.isNaN(parsedDate.getTime())) return '—';

        return parsedDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getCustomerName = (contract) => {
        const user = contract.customer?.user;
        return user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : 'Unknown customer';
    };

    const getAgentName = (contract) => {
        const user = contract.agent?.user;
        return user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : 'Unknown agent';
    };

    // =====================================
    // CREATE & UPDATE CONTRACT (Agent only)
    // =====================================

    const openCreateModal = () => {
        setContractForm(INITIAL_CONTRACT_FORM);
        setSelectedContract(null);
        setValidationErrors({});
        setError('');
        setSuccess('');
        setFormModal('create');
    };

    const openEditModal = (contract) => {
        setSelectedContract(contract);
        setContractForm({
            customer_id: contract.customer_id ?? '',
            policy_id: contract.policy_id ?? '',
            date_debut: contract.date_debut ? contract.date_debut.slice(0, 10) : '',
            date_fin: contract.date_fin ? contract.date_fin.slice(0, 10) : '',
            status: normalizeStatus(contract.status) || 'active',
        });
        setValidationErrors({});
        setError('');
        setSuccess('');
        setFormModal('edit');
    };

    const closeFormModal = () => {
        if (submitting) return;
        setFormModal(null);
        setSelectedContract(null);
        setContractForm(INITIAL_CONTRACT_FORM);
        setValidationErrors({});
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setContractForm(prev => ({ ...prev, [name]: value }));
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
        setError('');
    };

    const saveContract = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError('');
            setValidationErrors({});

            const payload = {
                customer_id: Number(contractForm.customer_id),
                policy_id: Number(contractForm.policy_id),
                date_debut: contractForm.date_debut,
                date_fin: contractForm.date_fin,
                status: contractForm.status,
            };

            if (formModal === 'create') {
                await api.post('/contracts', payload);
                setSuccess('Contract created successfully.');
            } else if (formModal === 'edit' && selectedContract) {
                await api.put(`/contracts/${selectedContract.id}`, payload);
                setSuccess(`Contract #${selectedContract.id} updated successfully.`);
            }

            setFormModal(null);
            setSelectedContract(null);
            setContractForm(INITIAL_CONTRACT_FORM);
            await getContracts();
        } catch (err) {
            console.error('Failed to save contract:', err);
            if (err.response?.status === 422) {
                setValidationErrors(err.response.data.errors || {});
                setError(
                    err.response.data.message ||
                    'Please correct the validation errors below.'
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    'Could not save contract.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // =====================================
    // DELETE CONTRACT (Agent only)
    // =====================================

    const deleteContract = async (contractId) => {
        if (!canDelete) return;

        const confirmed = window.confirm(
            `Delete contract #${contractId} and its related claims and reimbursements?`
        );
        if (!confirmed) return;

        try {
            setDeleting(true);
            setError('');

            await api.delete(`/contracts/${contractId}`);

            setSelectedContract(null);
            setSuccess(`Contract #${contractId} deleted successfully.`);
            await getContracts();
        } catch (err) {
            console.error('Failed to delete contract:', err);
            setError(
                err.response?.data?.message ||
                'Could not delete this contract.'
            );
        } finally {
            setDeleting(false);
        }
    };

    // =====================================
    // RENDER
    // =====================================

    const { rows: visibleRows, controls: pagination } = useRecordPage(filteredContracts);

    return (
        <section className="contracts-page">

            {/* HEADER */}
            <div className="contracts-header">
                <div>
                    <span className="contracts-eyebrow">
                        INSURANCE MANAGEMENT
                    </span>
                    <h1>Contracts Management</h1>
                    <p>
                        Manage insurance contracts and monitor their validity.
                    </p>
                </div>

                <div className="contracts-header-actions">
                    <button
                        className="contracts-refresh"
                        onClick={() => getContracts()}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    {canCreate && (
                        <button
                            className="contracts-create-btn"
                            onClick={openCreateModal}
                        >
                            <Plus size={16} />
                            New Contract
                        </button>
                    )}
                </div>
            </div>

            {/* STATISTICS */}
            <div className="contracts-stats">
                <div className="contract-stat-card">
                    <div className="contract-stat-icon">
                        <FileText />
                    </div>
                    <div>
                        <span>Total Contracts</span>
                        <h2>{stats.total}</h2>
                    </div>
                </div>

                <div className="contract-stat-card">
                    <div className="contract-stat-icon">
                        <CheckCircle />
                    </div>
                    <div>
                        <span>Active Contracts</span>
                        <h2>{stats.active}</h2>
                    </div>
                </div>

                <div className="contract-stat-card">
                    <div className="contract-stat-icon">
                        <Clock />
                    </div>
                    <div>
                        <span>Pending Contracts</span>
                        <h2>{stats.pending}</h2>
                    </div>
                </div>

                <div className="contract-stat-card">
                    <div className="contract-stat-icon">
                        <AlertCircle />
                    </div>
                    <div>
                        <span>Expired Contracts</span>
                        <h2>{stats.expired}</h2>
                    </div>
                </div>
            </div>

            {/* CONTRACTS TABLE */}
            <div className="contracts-container">
                <div className="contracts-toolbar">
                    <div>
                        <h2>All Contracts</h2>
                        <p>View and monitor insurance agreements.</p>
                    </div>

                    <div className="contracts-filters">
                        <div className="contracts-search">
                            <Search size={17} />
                            <input
                                type="text"
                                placeholder="Search contracts..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {error && !formModal && (
                    <div className="contracts-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="contracts-success">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="contracts-message">
                        Loading contracts...
                    </div>
                ) : filteredContracts.length === 0 ? (
                    <div className="contracts-message">
                        <FileText size={35} />
                        <h3>No contracts found</h3>
                        <p>No contracts match your search or filter.</p>
                    </div>
                ) : (
                    <div className="contracts-table-wrapper">
                        <table className="contracts-table">
                            <thead>
                                <tr>
                                    <th>Contract ID</th>
                                    <th>Customer</th>
                                    <th>Policy</th>
                                    <th>Agent</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {visibleRows.map(contract => (
                                    <tr key={contract.id}>
                                        <td>
                                            <strong>#{contract.id}</strong>
                                        </td>

                                        <td>
                                            <div className="contract-person">
                                                <div className="contract-avatar">
                                                    {getCustomerName(contract).charAt(0)}
                                                </div>
                                                <div>
                                                    <strong>
                                                        {getCustomerName(contract)}
                                                    </strong>
                                                    <span>
                                                        {contract.customer?.user?.email || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="contract-policy">
                                                <ShieldCheck size={16} />
                                                {contract.policy?.nom || 'Unknown policy'}
                                            </div>
                                        </td>

                                        <td>{getAgentName(contract)}</td>
                                        <td>{formatDate(contract.date_debut)}</td>
                                        <td>{formatDate(contract.date_fin)}</td>

                                        <td>
                                            <span className={`contract-status ${getStatusClass(isExpired(contract) ? 'expired' : contract.status)}`}>
                                                {isExpired(contract)
                                                    ? 'Expired'
                                                    : formatStatus(contract.status)}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="contract-row-actions">
                                                <button
                                                    className="contract-view-btn"
                                                    onClick={() => setSelectedContract(contract)}
                                                >
                                                    <Eye size={15} />
                                                    View
                                                </button>

                                                {canUpdate && (
                                                    <button
                                                        className="contract-edit-btn"
                                                        onClick={() => openEditModal(contract)}
                                                    >
                                                        <Pencil size={15} />
                                                        Modify
                                                    </button>
                                                )}

                                                {canDelete && (
                                                    <button
                                                        className="contract-row-delete-btn"
                                                        disabled={deleting}
                                                        onClick={() => deleteContract(contract.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && <RecordPagination {...pagination} />}
                <div className="contracts-footer">
                    {filteredContracts.length} of {contracts.length} contracts match
                </div>
            </div>

            {/* =====================================
                SIMPLE CONTRACT DETAILS MODAL (Portal)
               ===================================== */}
            {selectedContract && !formModal &&
                createPortal(
                    <div
                        className="contract-modal-overlay"
                        onClick={() => setSelectedContract(null)}
                    >
                        <div
                            className="contract-modal"
                            onClick={e => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="contract-modal-header">
                                <div>
                                    <span className="contract-modal-eyebrow">
                                        RECORD #{selectedContract.id}
                                    </span>
                                    <h2>Contract Details</h2>
                                    <p>
                                        Review the policyholder, coverage plan, and validity dates.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="contract-modal-close"
                                    onClick={() => setSelectedContract(null)}
                                    aria-label="Close modal"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="contract-modal-grid">
                                <div className="contract-info-field">
                                    <span>Customer</span>
                                    <strong>{getCustomerName(selectedContract)}</strong>
                                </div>

                                <div className="contract-info-field">
                                    <span>Customer Email</span>
                                    <strong>{selectedContract.customer?.user?.email || '—'}</strong>
                                </div>

                                <div className="contract-info-field">
                                    <span>Policy</span>
                                    <strong>
                                        {selectedContract.policy?.nom || '—'}
                                        {selectedContract.policy?.type
                                            ? ` (${selectedContract.policy.type})`
                                            : ''}
                                    </strong>
                                </div>

                                <div className="contract-info-field">
                                    <span>Base Price</span>
                                    <strong>
                                        {selectedContract.policy?.prix != null
                                            ? `${selectedContract.policy.prix} MAD`
                                            : '—'}
                                    </strong>
                                </div>

                                <div className="contract-info-field">
                                    <span>Start Date</span>
                                    <strong>{formatDate(selectedContract.date_debut)}</strong>
                                </div>

                                <div className="contract-info-field">
                                    <span>End Date</span>
                                    <strong>{formatDate(selectedContract.date_fin)}</strong>
                                </div>

                                <div className="contract-info-field">
                                    <span>Assigned Agent</span>
                                    <strong>{getAgentName(selectedContract)}</strong>
                                </div>

                                <div className="contract-info-field">
                                    <span>Status</span>
                                    <div>
                                        <span className={`contract-status ${getStatusClass(isExpired(selectedContract) ? 'expired' : selectedContract.status)}`}>
                                            {isExpired(selectedContract)
                                                ? 'Expired'
                                                : formatStatus(selectedContract.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="contract-modal-actions">
                                <button
                                    type="button"
                                    className="contract-close-btn"
                                    onClick={() => setSelectedContract(null)}
                                >
                                    Close
                                </button>

                                {canUpdate && (
                                    <button
                                        type="button"
                                        className="contract-primary-btn"
                                        onClick={() => openEditModal(selectedContract)}
                                    >
                                        Modify Contract
                                    </button>
                                )}

                                {canDelete && (
                                    <button
                                        type="button"
                                        className="contract-delete-btn"
                                        disabled={deleting}
                                        onClick={() => deleteContract(selectedContract.id)}
                                    >
                                        <Trash2 size={15} />
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* =====================================
                SIMPLE CREATE / MODIFY MODAL (Portal)
               ===================================== */}
            {formModal && (canCreate || canUpdate) &&
                createPortal(
                    <div
                        className="contract-modal-overlay"
                        onClick={closeFormModal}
                    >
                        <div
                            className="contract-modal"
                            onClick={e => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="contract-modal-header">
                                <div>
                                    <span className="contract-modal-eyebrow">
                                        {formModal === 'create'
                                            ? 'NEW RECORD'
                                            : `RECORD #${selectedContract?.id}`}
                                    </span>
                                    <h2>
                                        {formModal === 'create'
                                            ? 'New Contract'
                                            : 'Modify Contract'}
                                    </h2>
                                    <p>
                                        {formModal === 'create'
                                            ? 'Assign a policy and coverage period to a customer.'
                                            : 'Update the contract coverage details and validity period.'}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="contract-modal-close"
                                    onClick={closeFormModal}
                                    disabled={submitting}
                                    aria-label="Close modal"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form className="contract-form" onSubmit={saveContract}>
                                {error && (
                                    <div className="contracts-error contracts-error--inline">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}

                                <div className="contract-form-group">
                                    <label htmlFor="customer_id">Customer</label>
                                    <RecordSelect
                                        label="Customer"
                                        name="customer_id"
                                        path="/customers"
                                        value={contractForm.customer_id}
                                        onChange={handleFormChange}
                                        initialOption={formModal === 'edit' ? selectedContract?.customer : undefined}
                                        formatOption={(customer) => customer.user
                                            ? `${customer.user.first_name} ${customer.user.last_name} (${customer.user.email})`
                                            : `Customer #${customer.id}`}
                                    />
                                    {validationErrors.customer_id && (
                                        <span className="contract-field-error">
                                            {validationErrors.customer_id[0]}
                                        </span>
                                    )}
                                </div>

                                <div className="contract-form-row">
                                    <div className="contract-form-group">
                                        <label htmlFor="policy_id">Insurance Policy</label>
                                        <RecordSelect
                                            label="Insurance policy"
                                            name="policy_id"
                                            path="/policies"
                                            value={contractForm.policy_id}
                                            onChange={handleFormChange}
                                            initialOption={formModal === 'edit' ? selectedContract?.policy : undefined}
                                            formatOption={(policy) =>
                                                `${policy.nom}${policy.prix != null ? ` — ${policy.prix} MAD` : ''}`
                                            }
                                        />
                                        {validationErrors.policy_id && (
                                            <span className="contract-field-error">
                                                {validationErrors.policy_id[0]}
                                            </span>
                                        )}
                                    </div>

                                    <div className="contract-form-group">
                                        <label htmlFor="status">Status</label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={contractForm.status}
                                            onChange={handleFormChange}
                                            required
                                        >
                                            <option value="active">Active</option>
                                            <option value="pending">Pending</option>
                                            <option value="expired">Expired</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        {validationErrors.status && (
                                            <span className="contract-field-error">
                                                {validationErrors.status[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="contract-form-row">
                                    <div className="contract-form-group">
                                        <label htmlFor="date_debut">Start Date</label>
                                        <input
                                            id="date_debut"
                                            type="date"
                                            name="date_debut"
                                            value={contractForm.date_debut}
                                            onChange={handleFormChange}
                                            required
                                        />
                                        {validationErrors.date_debut && (
                                            <span className="contract-field-error">
                                                {validationErrors.date_debut[0]}
                                            </span>
                                        )}
                                    </div>

                                    <div className="contract-form-group">
                                        <label htmlFor="date_fin">End Date</label>
                                        <input
                                            id="date_fin"
                                            type="date"
                                            name="date_fin"
                                            value={contractForm.date_fin}
                                            onChange={handleFormChange}
                                            required
                                        />
                                        {validationErrors.date_fin && (
                                            <span className="contract-field-error">
                                                {validationErrors.date_fin[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="contract-modal-actions">
                                    <button
                                        type="button"
                                        className="contract-close-btn"
                                        onClick={closeFormModal}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="contract-primary-btn"
                                        disabled={submitting}
                                    >
                                        {submitting
                                            ? 'Saving...'
                                            : formModal === 'create'
                                            ? 'Create Contract'
                                            : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )
            }

        </section>
    );
}

export default Contracts;
