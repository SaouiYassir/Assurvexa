import api from '../../../services/api';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search,
    RefreshCw,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    AlertCircle,
    ShieldCheck,
    X
} from 'lucide-react';

import './claims.css';

function Claims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [updating, setUpdating] = useState(false);

    const getClaims = useCallback(async () => {
        try {
            setError('');
            setLoading(true);

            const response = await api.get('/claims');

            const data =
                response.data?.data?.data ??
                response.data?.data ??
                response.data;

            setClaims(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error('Failed to fetch claims:', err);
            setError('Could not load claims data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getClaims();
    }, [getClaims]);

    // Statistics
    const stats = useMemo(() => ({
        total: claims.length,
        pending: claims.filter(c => c.status === 'pending').length,
        approved: claims.filter(c => c.status === 'approved').length,
        rejected: claims.filter(c => c.status === 'rejected').length
    }), [claims]);

    // Filtering
    const filteredClaims = useMemo(() => {
        return claims.filter(claim => {
            const customer = claim.customer?.user;

            const matchesSearch =
                `${customer?.first_name || ''} ${customer?.last_name || ''}`
                    .toLowerCase()
                    .includes(search.toLowerCase()) ||
                String(claim.id).includes(search);

            const matchesStatus =
                statusFilter === 'all' ||
                claim.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [claims, search, statusFilter]);

    // Update claim status
    const updateStatus = async (claimId, status) => {
        try {
            setUpdating(true);

            await api.patch(`/claims/${claimId}`, {
                status
            });

            await getClaims();

            setSelectedClaim(null);

        } catch (err) {
            console.error('Failed to update claim:', err);
            setError('Could not update claim status.');
        } finally {
            setUpdating(false);
        }
    };

    const formatDate = date => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString();
    };

    const formatPrice = price =>
        `${Number(price || 0).toLocaleString('fr-FR')} MAD`;

    const getStatusClass = status => {
        switch (status) {
            case 'approved':
                return 'approved';
            case 'rejected':
                return 'rejected';
            default:
                return 'pending';
        }
    };

    return (
        <section className="claims-page">

            <div className="claims-header">
                <div>
                    <span className="claims-eyebrow">
                        INSURANCE MANAGEMENT
                    </span>
                    <h1>Claims Management</h1>
                    <p>
                        Review and manage insurance claims submitted by customers.
                    </p>
                </div>

                <button
                    className="claims-refresh"
                    onClick={getClaims}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {/* Statistics */}

            <div className="claims-stats">

                <div className="claim-stat-card">
                    <div className="claim-stat-icon blue">
                        <FileText />
                    </div>
                    <div>
                        <span>Total Claims</span>
                        <h2>{stats.total}</h2>
                    </div>
                </div>

                <div className="claim-stat-card">
                    <div className="claim-stat-icon orange">
                        <Clock />
                    </div>
                    <div>
                        <span>Pending</span>
                        <h2>{stats.pending}</h2>
                    </div>
                </div>

                <div className="claim-stat-card">
                    <div className="claim-stat-icon green">
                        <CheckCircle />
                    </div>
                    <div>
                        <span>Approved</span>
                        <h2>{stats.approved}</h2>
                    </div>
                </div>

                <div className="claim-stat-card">
                    <div className="claim-stat-icon red">
                        <XCircle />
                    </div>
                    <div>
                        <span>Rejected</span>
                        <h2>{stats.rejected}</h2>
                    </div>
                </div>

            </div>

            {/* Claims table */}

            <div className="claims-container">

                <div className="claims-toolbar">
                    <div>
                        <h2>All Claims</h2>
                        <p>Manage and monitor customer claims.</p>
                    </div>

                    <div className="claims-filters">

                        <div className="claims-search">
                            <Search size={17} />
                            <input
                                type="text"
                                placeholder="Search by customer or ID..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                    </div>
                </div>

                {error && (
                    <div className="claims-error">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="claims-message">
                        Loading claims...
                    </div>
                ) : filteredClaims.length === 0 ? (
                    <div className="claims-message">
                        <FileText size={35} />
                        <h3>No claims found</h3>
                        <p>There are no claims matching your search.</p>
                    </div>
                ) : (

                    <div className="claims-table-wrapper">
                        <table className="claims-table">
                            <thead>
                                <tr>
                                    <th>Claim ID</th>
                                    <th>Customer</th>
                                    <th>Contract</th>
                                    <th>Incident Date</th>
                                    <th>Estimated Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredClaims.map(claim => {
                                    const customer = claim.customer?.user;

                                    return (
                                        <tr key={claim.id}>
                                            <td>
                                                <strong>#{claim.id}</strong>
                                            </td>

                                            <td>
                                                <div className="claim-customer">
                                                    <div className="customer-avatar">
                                                        {customer?.first_name?.[0] || 'C'}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {customer
                                                                ? `${customer.first_name} ${customer.last_name}`
                                                                : 'Unknown customer'}
                                                        </strong>
                                                        <span>
                                                            {customer?.email || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                #{claim.contract_id || '—'}
                                            </td>

                                            <td>
                                                {formatDate(claim.incident_date)}
                                            </td>

                                            <td>
                                                <strong>
                                                    {formatPrice(claim.prix_estime)}
                                                </strong>
                                            </td>

                                            <td>
                                                <span className={`claim-status ${getStatusClass(claim.status)}`}>
                                                    {claim.status}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="claim-view-btn"
                                                    onClick={() => setSelectedClaim(claim)}
                                                >
                                                    <Eye size={16} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="claims-footer">
                    Showing {filteredClaims.length} of {claims.length} claims
                </div>

            </div>

            {/* Claim details modal */}

            {selectedClaim && (
                <div
                    className="claim-modal-overlay"
                    onClick={() => setSelectedClaim(null)}
                >
                    <div
                        className="claim-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="claim-modal-header">
                            <div>
                                <span>CLAIM DETAILS</span>
                                <h2>Claim #{selectedClaim.id}</h2>
                            </div>

                            <button onClick={() => setSelectedClaim(null)}>
                                <X />
                            </button>
                        </div>

                        <div className="claim-modal-body">

                            <div className="claim-detail-row">
                                <span>Customer</span>
                                <strong>
                                    {selectedClaim.customer?.user
                                        ? `${selectedClaim.customer.user.first_name} ${selectedClaim.customer.user.last_name}`
                                        : 'Unknown'}
                                </strong>
                            </div>

                            <div className="claim-detail-row">
                                <span>Contract ID</span>
                                <strong>#{selectedClaim.contract_id || '—'}</strong>
                            </div>

                            <div className="claim-detail-row">
                                <span>Incident Date</span>
                                <strong>{formatDate(selectedClaim.incident_date)}</strong>
                            </div>

                            <div className="claim-detail-row">
                                <span>Estimated Amount</span>
                                <strong>{formatPrice(selectedClaim.prix_estime)}</strong>
                            </div>

                            <div className="claim-detail-row">
                                <span>Status</span>
                                <span className={`claim-status ${getStatusClass(selectedClaim.status)}`}>
                                    {selectedClaim.status}
                                </span>
                            </div>

                            <div className="claim-description">
                                <span>Description</span>
                                <p>{selectedClaim.description || 'No description provided.'}</p>
                            </div>

                            <div className="claim-description">
                                <span>Decision Note</span>
                                <p>{selectedClaim.decision_note || 'No decision recorded.'}</p>
                            </div>

                        </div>

                        {selectedClaim.status === 'pending' && (
                            <div className="claim-modal-actions">

                                <button
                                    className="claim-reject-btn"
                                    disabled={updating}
                                    onClick={() => updateStatus(selectedClaim.id, 'rejected')}
                                >
                                    <XCircle size={17} />
                                    Reject
                                </button>

                                <button
                                    className="claim-approve-btn"
                                    disabled={updating}
                                    onClick={() => updateStatus(selectedClaim.id, 'approved')}
                                >
                                    <CheckCircle size={17} />
                                    Approve
                                </button>

                            </div>
                        )}
                    </div>
                </div>
            )}

        </section>
    );
}

export default Claims;
