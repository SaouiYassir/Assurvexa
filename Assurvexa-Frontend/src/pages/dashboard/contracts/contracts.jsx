import api from '../../../services/api';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search,
    RefreshCw,
    Eye,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    X,
    Trash2,
    CalendarDays,
    User,
    ShieldCheck,
    Briefcase
} from 'lucide-react';

import './contracts.css';

function Contracts() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [selectedContract, setSelectedContract] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // =====================================
    // FETCH CONTRACTS
    // =====================================

    const getContracts = useCallback(async () => {
        try {
            setError('');
            setLoading(true);

            const response = await api.get('/contracts');

            const data =
                response.data?.data?.data ??
                response.data?.data ??
                response.data;

            setContracts(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error('Failed to fetch contracts:', err);
            setError(
                err.response?.data?.message ||
                'Could not load contracts data.'
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getContracts();
    }, [getContracts]);

    // =====================================
    // STATUS HELPERS
    // =====================================

    const normalizeStatus = (status) =>
        String(status || 'unknown').toLowerCase();

    const getStatusClass = (status) => {
        const value = normalizeStatus(status);

        if (['active', 'approved', 'valid'].includes(value)) {
            return 'active';
        }

        if (['pending', 'in_progress'].includes(value)) {
            return 'pending';
        }

        if (['expired'].includes(value)) {
            return 'expired';
        }

        if (['cancelled', 'canceled', 'terminated', 'rejected'].includes(value)) {
            return 'cancelled';
        }

        return 'unknown';
    };

    const formatStatus = (status) => {
        return String(status || 'Unknown')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    };

    const isExpired = (contract) => {
        if (normalizeStatus(contract.status) === 'expired') {
            return true;
        }

        if (!contract.date_fin) return false;

        const endDate = new Date(`${contract.date_fin.slice(0, 10)}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return endDate < today &&
            !['cancelled', 'canceled', 'terminated', 'rejected'].includes(
                normalizeStatus(contract.status)
            );
    };

    // =====================================
    // STATISTICS
    // =====================================

    const stats = useMemo(() => ({
        total: contracts.length,

        active: contracts.filter(contract =>
            ['active', 'approved', 'valid'].includes(
                normalizeStatus(contract.status)
            ) && !isExpired(contract)
        ).length,

        pending: contracts.filter(contract =>
            normalizeStatus(contract.status) === 'pending'
        ).length,

        expired: contracts.filter(contract =>
            isExpired(contract)
        ).length

    }), [contracts]);

    // =====================================
    // SEARCH AND FILTER
    // =====================================

    const filteredContracts = useMemo(() => {
        return contracts.filter(contract => {
            const customer = contract.customer?.user;
            const agent = contract.agent?.user;
            const policy = contract.policy;

            const customerName =
                `${customer?.first_name || ''} ${customer?.last_name || ''}`;

            const agentName =
                `${agent?.first_name || ''} ${agent?.last_name || ''}`;

            const searchValue = search.toLowerCase();

            const matchesSearch =
                String(contract.id).includes(searchValue) ||
                customerName.toLowerCase().includes(searchValue) ||
                agentName.toLowerCase().includes(searchValue) ||
                String(policy?.nom || '').toLowerCase().includes(searchValue);

            const matchesStatus =
                statusFilter === 'all' ||
                (
                    statusFilter === 'expired'
                        ? isExpired(contract)
                        : normalizeStatus(contract.status) === statusFilter
                );

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
            year: 'numeric'
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
    // DELETE CONTRACT
    // =====================================

    const deleteContract = async (contractId) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete contract #${contractId}?`
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            setError('');

            await api.delete(`/contracts/${contractId}`);

            setSelectedContract(null);

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

                <button
                    className="contracts-refresh"
                    onClick={getContracts}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
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
                        <p>
                            View and monitor insurance agreements.
                        </p>
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

                {error && (
                    <div className="contracts-error">
                        <AlertCircle size={18} />
                        {error}
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

                        <p>
                            No contracts match your search or filter.
                        </p>
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

                                {filteredContracts.map(contract => (

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

                                        <td>
                                            {getAgentName(contract)}
                                        </td>

                                        <td>
                                            {formatDate(contract.date_debut)}
                                        </td>

                                        <td>
                                            {formatDate(contract.date_fin)}
                                        </td>

                                        <td>
                                            <span className={`contract-status ${getStatusClass(isExpired(contract) ? 'expired' : contract.status)}`}>
                                                {isExpired(contract)
                                                    ? 'Expired'
                                                    : formatStatus(contract.status)}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                className="contract-view-btn"
                                                onClick={() => setSelectedContract(contract)}
                                            >
                                                <Eye size={15} />
                                                View
                                            </button>
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

                <div className="contracts-footer">
                    Showing {filteredContracts.length} of {contracts.length} contracts
                </div>

            </div>

            {/* CONTRACT DETAILS MODAL */}

            {selectedContract && (

                <div
                    className="contract-modal-overlay"
                    onClick={() => setSelectedContract(null)}
                >

                    <div
                        className="contract-modal"
                        onClick={e => e.stopPropagation()}
                    >

                        <div className="contract-modal-header">

                            <div>
                                <span>CONTRACT DETAILS</span>
                                <h2>Contract #{selectedContract.id}</h2>
                            </div>

                            <button
                                onClick={() => setSelectedContract(null)}
                            >
                                <X size={19} />
                            </button>

                        </div>

                        <div className="contract-modal-body">

                            <div className="contract-detail-section">
                                <h3>
                                    <User size={16} />
                                    Customer Information
                                </h3>

                                <div className="contract-detail-row">
                                    <span>Full Name</span>
                                    <strong>
                                        {getCustomerName(selectedContract)}
                                    </strong>
                                </div>

                                <div className="contract-detail-row">
                                    <span>Email</span>
                                    <strong>
                                        {selectedContract.customer?.user?.email || '—'}
                                    </strong>
                                </div>
                            </div>

                            <div className="contract-detail-section">
                                <h3>
                                    <ShieldCheck size={16} />
                                    Insurance Information
                                </h3>

                                <div className="contract-detail-row">
                                    <span>Policy</span>
                                    <strong>
                                        {selectedContract.policy?.nom || '—'}
                                    </strong>
                                </div>

                                <div className="contract-detail-row">
                                    <span>Policy Type</span>
                                    <strong>
                                        {selectedContract.policy?.type || '—'}
                                    </strong>
                                </div>

                                <div className="contract-detail-row">
                                    <span>Policy Price</span>
                                    <strong>
                                        {selectedContract.policy?.prix != null
                                            ? `${selectedContract.policy.prix} MAD`
                                            : '—'}
                                    </strong>
                                </div>
                            </div>

                            <div className="contract-detail-section">
                                <h3>
                                    <Briefcase size={16} />
                                    Agent Information
                                </h3>

                                <div className="contract-detail-row">
                                    <span>Agent</span>
                                    <strong>
                                        {getAgentName(selectedContract)}
                                    </strong>
                                </div>
                            </div>

                            <div className="contract-detail-section">
                                <h3>
                                    <CalendarDays size={16} />
                                    Contract Period
                                </h3>

                                <div className="contract-detail-row">
                                    <span>Start Date</span>
                                    <strong>
                                        {formatDate(selectedContract.date_debut)}
                                    </strong>
                                </div>

                                <div className="contract-detail-row">
                                    <span>End Date</span>
                                    <strong>
                                        {formatDate(selectedContract.date_fin)}
                                    </strong>
                                </div>

                                <div className="contract-detail-row">
                                    <span>Status</span>

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
                                className="contract-close-btn"
                                onClick={() => setSelectedContract(null)}
                            >
                                Close
                            </button>

                            <button
                                className="contract-delete-btn"
                                disabled={deleting}
                                onClick={() => deleteContract(selectedContract.id)}
                            >
                                <Trash2 size={16} />
                                {deleting ? 'Deleting...' : 'Delete Contract'}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </section>
    );
}

export default Contracts;
