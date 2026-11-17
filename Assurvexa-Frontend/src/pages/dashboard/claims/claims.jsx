import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { can } from '../../../services/permissions';
import './claims.css';

const INITIAL_CLAIM_FORM = {
  contract_id: '',
  incident_date: '',
  prix_estime: '',
  description: '',
};

function Claims({ role: propRole }) {
  const [role, setRole] = useState(propRole || null);
  const [claims, setClaims] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [modal, setModal] = useState(null); // 'view' | 'create' | 'edit' | 'delete' | null
  const [decisionNote, setDecisionNote] = useState('');
  const [claimForm, setClaimForm] = useState(INITIAL_CLAIM_FORM);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (propRole) setRole(propRole);
  }, [propRole]);

  // Resolve authenticated user's role if not passed via props
  useEffect(() => {
    if (propRole) return;
    let isMounted = true;

    const fetchCurrentUserRole = async () => {
      try {
        const res = await api.get('/me');
        const userRole = res.data?.user?.role ?? res.data?.data?.role ?? res.data?.role;
        if (isMounted && userRole) {
          setRole(userRole);
        }
      } catch (err) {
        console.error('Failed to resolve user role:', err);
      }
    };

    fetchCurrentUserRole();
    return () => {
      isMounted = false;
    };
  }, [propRole]);

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  // READ CLAIMS
  const getClaims = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await api.get('/claims');
      const data =
        response.data?.data?.data ??
        response.data?.data ??
        response.data;

      setClaims(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch claims:', err);
      setError(err.response?.data?.message || 'Could not load claims data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getClaims();
  }, [getClaims]);

  // Role-specific capabilities
  const isAgent = role === 'agent';
  const isCustomer = role === 'customer';

  const canCreate = isCustomer && can(role, 'claims', 'create');
  const canUpdate = can(role, 'claims', 'update');
  const canDelete = isAgent && can(role, 'claims', 'delete');

  const canAgentAdjudicate = isAgent && canUpdate;
  const canCustomerEdit = isCustomer && canUpdate;

  // Admin has NO actions column; only Agent and Customer do
  const showActionsColumn = isAgent || isCustomer;

  // Fetch contracts when customer can file/edit claims
  useEffect(() => {
    if (!canCreate && !canCustomerEdit) return;
    let isMounted = true;

    const fetchContracts = async () => {
      try {
        const res = await api.get('/contracts');
        const data = res.data?.data?.data ?? res.data?.data ?? res.data;
        if (isMounted && Array.isArray(data)) {
          setContracts(data);
        }
      } catch (err) {
        console.error('Failed to load contracts:', err);
      }
    };

    fetchContracts();
    return () => {
      isMounted = false;
    };
  }, [canCreate, canCustomerEdit]);

  // STATISTICS
  const stats = useMemo(
    () => ({
      total: claims.length,
      pending: claims.filter((c) => c.status === 'pending').length,
      approved: claims.filter((c) => c.status === 'approved').length,
      rejected: claims.filter((c) => c.status === 'rejected').length,
    }),
    [claims]
  );

  // FILTERED & SORTED CLAIMS
  const filteredClaims = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return claims
      .filter((claim) => {
        const customer = claim.customer?.user || {};
        const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
        const email = (customer.email || '').toLowerCase();
        const claimIdStr = String(claim.id || '');
        const contractIdStr = String(claim.contract_id || '');
        const description = (claim.description || '').toLowerCase();

        if (query) {
          if (
            searchField === 'customer' &&
            !fullName.includes(query) &&
            !email.includes(query)
          ) {
            return false;
          }
          if (searchField === 'claim_id' && !claimIdStr.includes(query)) return false;
          if (searchField === 'contract_id' && !contractIdStr.includes(query)) return false;
          if (searchField === 'description' && !description.includes(query)) return false;
          if (searchField === 'all') {
            const matchesAny =
              fullName.includes(query) ||
              email.includes(query) ||
              claimIdStr.includes(query) ||
              contractIdStr.includes(query) ||
              description.includes(query);
            if (!matchesAny) return false;
          }
        }

        if (statusFilter !== 'all' && claim.status !== statusFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
        if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
        if (sortBy === 'date_desc') {
          return new Date(b.incident_date || 0) - new Date(a.incident_date || 0);
        }
        if (sortBy === 'date_asc') {
          return new Date(a.incident_date || 0) - new Date(b.incident_date || 0);
        }
        if (sortBy === 'amount_desc') {
          return Number(b.prix_estime || 0) - Number(a.prix_estime || 0);
        }
        if (sortBy === 'amount_asc') {
          return Number(a.prix_estime || 0) - Number(b.prix_estime || 0);
        }
        return 0;
      });
  }, [claims, searchQuery, searchField, statusFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    searchField !== 'all' ||
    statusFilter !== 'all' ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSearchField('all');
    setStatusFilter('all');
    setSortBy('newest');
  };

  // MODAL CONTROLS
  const openViewModal = (claim) => {
    setSelectedClaim(claim);
    setDecisionNote(claim.decision_note || '');
    setError('');
    setSuccess('');
    setModal('view');
  };

  const openCreateModal = () => {
    setClaimForm(INITIAL_CLAIM_FORM);
    setSelectedClaim(null);
    setValidationErrors({});
    setError('');
    setSuccess('');
    setModal('create');
  };

  const openEditModal = (claim) => {
    setSelectedClaim(claim);
    setClaimForm({
      contract_id: claim.contract_id ?? '',
      incident_date: claim.incident_date ? claim.incident_date.slice(0, 10) : '',
      prix_estime: claim.prix_estime ?? '',
      description: claim.description ?? '',
    });
    setValidationErrors({});
    setError('');
    setSuccess('');
    setModal('edit');
  };

  const openDeleteModal = (claim) => {
    setSelectedClaim(claim);
    setError('');
    setSuccess('');
    setModal('delete');
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setSelectedClaim(null);
    setDecisionNote('');
    setClaimForm(INITIAL_CLAIM_FORM);
    setValidationErrors({});
    setError('');
  };

  // AGENT: UPDATE CLAIM STATUS
  const updateStatus = async (claimId, status) => {
    try {
      setSubmitting(true);
      setError('');

      await api.put(`/claims/${claimId}`, {
        status,
        ...(decisionNote.trim() ? { decision_note: decisionNote.trim() } : {}),
      });

      setModal(null);
      setSelectedClaim(null);
      setDecisionNote('');
      await getClaims();
      setSuccess(
        `Claim #${claimId} has been ${status === 'approved' ? 'approved' : 'rejected'}.`
      );
    } catch (err) {
      console.error('Failed to update claim status:', err);
      setError(err.response?.data?.message || 'Could not update claim status.');
    } finally {
      setSubmitting(false);
    }
  };

  // CUSTOMER: FORM HANDLING & SUBMIT CREATE / EDIT
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setClaimForm((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const saveCustomerClaim = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setValidationErrors({});

      const payload = {
        ...claimForm,
        contract_id: Number(claimForm.contract_id),
        prix_estime: Number(claimForm.prix_estime),
      };

      if (modal === 'create') {
        await api.post('/claims', payload);
        setSuccess('Claim submitted successfully.');
      } else if (modal === 'edit' && selectedClaim) {
        await api.put(`/claims/${selectedClaim.id}`, payload);
        setSuccess(`Claim #${selectedClaim.id} updated successfully.`);
      }

      setModal(null);
      setSelectedClaim(null);
      setClaimForm(INITIAL_CLAIM_FORM);
      await getClaims();
    } catch (err) {
      console.error('Failed to save claim:', err);
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError(err.response.data.message || 'Please correct the validation errors below.');
      } else {
        setError(err.response?.data?.message || 'Could not save claim.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // AGENT: DELETE CLAIM
  const deleteClaim = async () => {
    if (!selectedClaim) return;

    try {
      setSubmitting(true);
      setError('');

      await api.delete(`/claims/${selectedClaim.id}`);

      setModal(null);
      setSelectedClaim(null);
      await getClaims();
      setSuccess('Claim deleted successfully.');
    } catch (err) {
      console.error('Failed to delete claim:', err);
      setError(err.response?.data?.message || 'Could not delete claim.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'claim-badge claim-badge--approved';
      case 'rejected':
        return 'claim-badge claim-badge--rejected';
      default:
        return 'claim-badge claim-badge--pending';
    }
  };

  return (
    <section className="claims-section" id="claims-section">
      <div className="container">
        {/* HEADER */}
        <header className="claims-header">
          <div>
            <span className="eyebrow">Claims Ledger</span>
            <h1 className="claims-title">Claims Management</h1>
            <p className="claims-subtitle">
              {isCustomer
                ? 'Submit new insurance claims, track review progress, and update pending declarations.'
                : 'Review, adjudicate, and audit insurance claims submitted across active contracts.'}
            </p>
          </div>

          <div className="claims-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => getClaims(true)}
              disabled={loading || refreshing}
              title="Refresh claims list"
            >
              <span className={refreshing ? 'spin-icon' : ''}>↻</span>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>

            {canCreate && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={openCreateModal}
              >
                + File a Claim
              </button>
            )}
          </div>
        </header>

        {/* FEEDBACK */}
        {!modal && error && (
          <div className="claims-alert claims-alert--error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="alert-dismiss"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {success && (
          <div className="claims-alert claims-alert--success" role="status">
            <span>{success}</span>
            <button
              type="button"
              className="alert-dismiss"
              onClick={() => setSuccess('')}
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
        )}

        {/* KPI SUMMARY STRIP */}
        <div className="claims-stats-grid">
          <div
            className={`claim-stat-card ${statusFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('all')}
          >
            <span className="claim-stat-label">Total Claims</span>
            <strong className="claim-stat-value">{stats.total}</strong>
          </div>

          <div
            className={`claim-stat-card ${statusFilter === 'pending' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('pending')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('pending')}
          >
            <span className="claim-stat-label">Pending Review</span>
            <strong className="claim-stat-value claim-stat-value--pending">
              {stats.pending}
            </strong>
          </div>

          <div
            className={`claim-stat-card ${statusFilter === 'approved' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('approved')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('approved')}
          >
            <span className="claim-stat-label">Approved</span>
            <strong className="claim-stat-value claim-stat-value--approved">
              {stats.approved}
            </strong>
          </div>

          <div
            className={`claim-stat-card ${statusFilter === 'rejected' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('rejected')}
          >
            <span className="claim-stat-label">Rejected</span>
            <strong className="claim-stat-value claim-stat-value--rejected">
              {stats.rejected}
            </strong>
          </div>
        </div>

        {/* SEARCH & FILTER TOOLBAR */}
        <div className="claims-toolbar">
          <div className="claims-search-group">
            <select
              className="form-control claims-field-select"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              aria-label="Search by field"
            >
              <option value="all">All Fields</option>
              {!isCustomer && <option value="customer">Customer</option>}
              <option value="claim_id">Claim ID</option>
              <option value="contract_id">Contract ID</option>
              <option value="description">Description</option>
            </select>

            <div className="claims-search-input-wrap">
              <input
                type="text"
                className="form-control claims-search-input"
                placeholder={`Search by ${
                  searchField === 'all'
                    ? isCustomer
                      ? 'claim ID, contract ID, or description...'
                      : 'customer, claim ID, contract ID, or description...'
                    : searchField === 'claim_id'
                    ? 'claim ID...'
                    : searchField === 'contract_id'
                    ? 'contract ID...'
                    : searchField + '...'
                }`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="claims-filter-group">
            <select
              className="form-control claims-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">Status: All Claims</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              className="form-control claims-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort claims"
            >
              <option value="newest">Sort: Newest ID</option>
              <option value="oldest">Sort: Oldest ID</option>
              <option value="date_desc">Sort: Incident (Newest)</option>
              <option value="date_asc">Sort: Incident (Oldest)</option>
              <option value="amount_desc">Sort: Amount (High → Low)</option>
              <option value="amount_asc">Sort: Amount (Low → High)</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={resetFilters}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* LEDGER SUMMARY BAR */}
        <div className="claims-ledger-bar">
          <span className="claims-count-label">
            Showing <strong>{filteredClaims.length}</strong> of{' '}
            <strong>{claims.length}</strong> Recorded Claims
          </span>
        </div>

        {/* CLAIMS TABLE */}
        <div className="claims-ledger-card">
          <div className="table-responsive">
            <table className="table-claims">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Customer</th>
                  <th>Contract</th>
                  <th>Incident Date</th>
                  <th>Estimated Amount</th>
                  <th>Status</th>
                  {showActionsColumn && <th className="text-right">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={showActionsColumn ? 7 : 6} className="no-data">
                      Loading claims ledger...
                    </td>
                  </tr>
                ) : filteredClaims.length > 0 ? (
                  filteredClaims.map((claim) => {
                    const customer = claim.customer?.user;

                    return (
                      <tr key={claim.id}>
                        <td className="claim-id">#{claim.id}</td>

                        <td>
                          <strong className="claim-customer-name">
                            {customer
                              ? `${customer.first_name} ${customer.last_name}`
                              : 'Unknown customer'}
                          </strong>
                          {customer?.email && (
                            <span className="claim-subtext">{customer.email}</span>
                          )}
                        </td>

                        <td>
                          <span className="badge--neutral">
                            #{claim.contract_id || '—'}
                          </span>
                        </td>

                        <td>{formatDate(claim.incident_date)}</td>

                        <td className="claim-price">
                          {formatPrice(claim.prix_estime)} <span>MAD</span>
                        </td>

                        <td>
                          <span className={getStatusBadgeClass(claim.status)}>
                            {claim.status}
                          </span>
                        </td>

                        {showActionsColumn && (
                          <td className="text-right">
                            <div className="action-buttons">
                              {/* VIEW / AGENT ADJUDICATE */}
                              <button
                                type="button"
                                className="btn-ledger"
                                onClick={() => openViewModal(claim)}
                              >
                                {canAgentAdjudicate && claim.status === 'pending'
                                  ? 'Review'
                                  : 'Details'}
                              </button>

                              {/* CUSTOMER: MODIFY OWN PENDING CLAIM */}
                              {canCustomerEdit && claim.status === 'pending' && (
                                <button
                                  type="button"
                                  className="btn-ledger"
                                  onClick={() => openEditModal(claim)}
                                >
                                  Modify
                                </button>
                              )}

                              {/* AGENT: DELETE CLAIM */}
                              {canDelete && (
                                <button
                                  type="button"
                                  className="btn-ledger btn-ledger--danger"
                                  onClick={() => openDeleteModal(claim)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={showActionsColumn ? 7 : 6} className="no-data">
                      {hasActiveFilters
                        ? 'No claims match your current search or filter criteria.'
                        : 'No claims found in the ledger.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CLAIM DETAILS & AGENT ADJUDICATION MODAL */}
      {modal === 'view' && selectedClaim && showActionsColumn && (
        <div className="claim-modal-overlay" onClick={closeModal}>
          <div
            className="claim-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="claim-modal-header">
              <div>
                <span className="eyebrow">Claim Dossier</span>
                <h2>Claim #{selectedClaim.id}</h2>
                <p>
                  Submitted for Contract #{selectedClaim.contract_id || '—'} •{' '}
                  {formatDate(selectedClaim.incident_date)}
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

            <div className="claim-dossier-grid">
              <div className="claim-dossier-item">
                <span>Policyholder</span>
                <strong>
                  {selectedClaim.customer?.user
                    ? `${selectedClaim.customer.user.first_name} ${selectedClaim.customer.user.last_name}`
                    : 'Unknown'}
                </strong>
              </div>

              <div className="claim-dossier-item">
                <span>Contact Email</span>
                <strong>{selectedClaim.customer?.user?.email || '—'}</strong>
              </div>

              <div className="claim-dossier-item">
                <span>Contract Reference</span>
                <strong>#{selectedClaim.contract_id || '—'}</strong>
              </div>

              <div className="claim-dossier-item">
                <span>Incident Date</span>
                <strong>{formatDate(selectedClaim.incident_date)}</strong>
              </div>

              <div className="claim-dossier-item">
                <span>Estimated Loss</span>
                <strong>{formatPrice(selectedClaim.prix_estime)} MAD</strong>
              </div>

              <div className="claim-dossier-item">
                <span>Current Status</span>
                <div>
                  <span className={getStatusBadgeClass(selectedClaim.status)}>
                    {selectedClaim.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="claim-dossier-block">
              <label>Incident Description</label>
              <p>{selectedClaim.description || 'No description provided.'}</p>
            </div>

            {canAgentAdjudicate && selectedClaim.status === 'pending' ? (
              <div className="claim-form-group">
                <label htmlFor="decision_note">Adjudication Decision Note (Optional)</label>
                <textarea
                  id="decision_note"
                  className="form-control claim-textarea"
                  rows="3"
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="Enter justification, coverage notes, or reason for approval/rejection..."
                />
              </div>
            ) : (
              <div className="claim-dossier-block">
                <label>Decision Note</label>
                <p>{selectedClaim.decision_note || 'No decision note recorded.'}</p>
              </div>
            )}

            {error && (
              <div className="claims-alert claims-alert--error" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="claim-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Close
              </button>

              {canAgentAdjudicate && selectedClaim.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={submitting}
                    onClick={() => updateStatus(selectedClaim.id, 'rejected')}
                  >
                    {submitting ? 'Processing...' : 'Reject Claim'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-approve"
                    disabled={submitting}
                    onClick={() => updateStatus(selectedClaim.id, 'approved')}
                  >
                    {submitting ? 'Processing...' : 'Approve Claim'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / MODIFY CLAIM MODAL (Customer) */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="claim-modal-overlay" onClick={closeModal}>
          <div
            className="claim-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="claim-modal-header">
              <div>
                <span className="eyebrow">
                  {modal === 'create' ? 'New Declaration' : `Claim #${selectedClaim?.id}`}
                </span>
                <h2>{modal === 'create' ? 'File an Insurance Claim' : 'Modify Claim'}</h2>
                <p>
                  {modal === 'create'
                    ? 'Provide the incident details and estimated loss for review.'
                    : 'Update your pending claim declaration before it is reviewed.'}
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

            <form className="claim-modal-form" onSubmit={saveCustomerClaim}>
              <div className="claim-form-row">
                <div className="claim-form-group">
                  <label htmlFor="contract_id">Contract</label>
                  {contracts.length > 0 ? (
                    <select
                      id="contract_id"
                      className="form-control"
                      name="contract_id"
                      value={claimForm.contract_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="" disabled>
                        Select a contract
                      </option>
                      {contracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          Contract #{contract.id}{' '}
                          {contract.policy?.nom ? `— ${contract.policy.nom}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="contract_id"
                      className="form-control"
                      type="number"
                      name="contract_id"
                      value={claimForm.contract_id}
                      onChange={handleFormChange}
                      placeholder="Enter Contract ID"
                      required
                    />
                  )}
                  {validationErrors.contract_id && (
                    <span className="field-error">{validationErrors.contract_id[0]}</span>
                  )}
                </div>

                <div className="claim-form-group">
                  <label htmlFor="incident_date">Incident Date</label>
                  <input
                    id="incident_date"
                    className="form-control"
                    type="date"
                    name="incident_date"
                    value={claimForm.incident_date}
                    onChange={handleFormChange}
                    required
                  />
                  {validationErrors.incident_date && (
                    <span className="field-error">
                      {validationErrors.incident_date[0]}
                    </span>
                  )}
                </div>
              </div>

              <div className="claim-form-group">
                <label htmlFor="prix_estime">Estimated Amount (MAD)</label>
                <input
                  id="prix_estime"
                  className="form-control"
                  type="number"
                  name="prix_estime"
                  value={claimForm.prix_estime}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
                {validationErrors.prix_estime && (
                  <span className="field-error">{validationErrors.prix_estime[0]}</span>
                )}
              </div>

              <div className="claim-form-group">
                <label htmlFor="description">Incident Description</label>
                <textarea
                  id="description"
                  className="form-control claim-textarea"
                  name="description"
                  rows="4"
                  value={claimForm.description}
                  onChange={handleFormChange}
                  placeholder="Describe the incident, circumstances, and damages..."
                  required
                />
                {validationErrors.description && (
                  <span className="field-error">{validationErrors.description[0]}</span>
                )}
              </div>

              {error && (
                <div className="claims-alert claims-alert--error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <div className="claim-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting
                    ? 'Saving...'
                    : modal === 'create'
                    ? 'Submit Claim'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL (Agent) */}
      {modal === 'delete' && selectedClaim && (
        <div className="claim-modal-overlay" onClick={closeModal}>
          <div
            className="claim-modal claim-modal--delete"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="claim-modal-header">
              <div>
                <span className="eyebrow">Confirm Removal</span>
                <h2>Delete Claim</h2>
                <p>
                  Are you sure you want to delete this claim record? This action
                  cannot be undone.
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

            <div className="delete-claim-box">
              <strong>
                Claim #{selectedClaim.id} • {formatPrice(selectedClaim.prix_estime)} MAD
              </strong>
              <span>
                Contract #{selectedClaim.contract_id || '—'} • Status:{' '}
                {selectedClaim.status}
              </span>
            </div>

            {error && (
              <div className="claims-alert claims-alert--error" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="claim-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={deleteClaim}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete Claim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Claims;