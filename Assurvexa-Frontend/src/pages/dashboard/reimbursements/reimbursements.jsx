import { useDashboardRecords, useRecordPage } from '../useDashboardRecords';
import RecordPagination from '../RecordPagination';
import { useAuth } from '../../../context/useAuth';
import RecordSelect from '../RecordSelect';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  RefreshCw,
  Eye,
  Plus,
  Pencil,
  X,
} from 'lucide-react';
import api from '../../../services/api';
import { can } from '../../../services/permissions';
import './reimbursements.css';

const PAYMENT_METHODS = [
  { value: 'transfer_bancaire', label: 'Bank Transfer (Virement)' },
  { value: 'check', label: 'Check (Chèque)' },
  { value: 'cash', label: 'Cash (Espèces)' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
];

const INITIAL_FORM = {
  claim_id: '',
  prix: '',
  methode_paiement: 'transfer_bancaire',
  status_paiement: 'pending',
  date_paiement: '',
};

function Reimbursements({ role: propRole }) {
  const { user } = useAuth();
  const role = propRole ?? user?.role;

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search, Filter & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Modals: 'view' | 'create' | 'edit' | 'delete' | null
  const [modal, setModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  // Role permissions:
  // - Admin & Customer: View only (no Actions column, no Create/Update/Delete)
  // - Agent: Full CRUD
  const isAgent = role === 'agent';
  const isCustomer = role === 'customer';

  const canCreate = isAgent && can(role, 'reimbursements', 'create');
  const canUpdate = isAgent && can(role, 'reimbursements', 'update');
  const canDelete = isAgent && can(role, 'reimbursements', 'delete');
  const showActionsColumn = isAgent;

  // =====================================
  // FETCH REIMBURSEMENTS
  // =====================================
  const { records: reimbursements, loading, refreshing, reload: getReimbursements } =
    useDashboardRecords('/reimbursements', setError);

  // =====================================
  // STATISTICS
  // =====================================
  const stats = useMemo(() => {
    const totalAmount = reimbursements.reduce(
      (sum, item) => sum + Number(item.prix || 0),
      0
    );

    return {
      total: reimbursements.length,
      paid: reimbursements.filter(
        (r) => String(r.status_paiement || '').toLowerCase() === 'paid'
      ).length,
      pending: reimbursements.filter(
        (r) => String(r.status_paiement || '').toLowerCase() === 'pending'
      ).length,
      totalAmount,
    };
  }, [reimbursements]);

  // =====================================
  // FILTER & SORT
  // =====================================
  const filteredReimbursements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reimbursements
      .filter((item) => {
        const customer = item.claim?.customer?.user;
        const customerName = `${customer?.first_name || ''} ${customer?.last_name || ''}`.toLowerCase();
        const customerEmail = (customer?.email || '').toLowerCase();
        const idStr = String(item.id || '');
        const claimIdStr = String(item.claim_id || '');

        if (query) {
          const matchesQuery =
            idStr.includes(query) ||
            claimIdStr.includes(query) ||
            customerName.includes(query) ||
            customerEmail.includes(query);
          if (!matchesQuery) return false;
        }

        if (
          statusFilter !== 'all' &&
          String(item.status_paiement || '').toLowerCase() !== statusFilter
        ) {
          return false;
        }

        if (
          methodFilter !== 'all' &&
          String(item.methode_paiement || '').toLowerCase() !== methodFilter
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
        if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
        if (sortBy === 'amount_desc') return Number(b.prix || 0) - Number(a.prix || 0);
        if (sortBy === 'amount_asc') return Number(a.prix || 0) - Number(b.prix || 0);
        return 0;
      });
  }, [reimbursements, searchQuery, statusFilter, methodFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    methodFilter !== 'all' ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMethodFilter('all');
    setSortBy('newest');
  };

  // =====================================
  // HELPERS
  // =====================================
  const formatDate = (date) => {
    if (!date) return '—';
    const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString('en-GB', {
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

  const formatMethod = (method) => {
    const found = PAYMENT_METHODS.find(
      (m) => m.value === String(method || '').toLowerCase()
    );
    if (found) return found.label;
    return String(method || '—')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStatusClass = (status) => {
    const val = String(status || '').toLowerCase();
    if (['paid', 'completed', 'approved'].includes(val)) return 'paid';
    if (['failed', 'rejected', 'cancelled'].includes(val)) return 'failed';
    return 'pending';
  };

  const getCustomerName = (item) => {
    const user = item.claim?.customer?.user;
    return user
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : 'Policyholder';
  };

  const getAgentName = (item) => {
    const user = item.claim?.agent?.user;
    return user
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : '—';
  };

  // =====================================
  // MODAL CONTROLS & CRUD (Agent only)
  // =====================================
  const openViewModal = (item) => {
    setSelectedItem(item);
    setError('');
    setSuccess('');
    setModal('view');
  };

  const openCreateModal = () => {
    setForm(INITIAL_FORM);
    setSelectedItem(null);
    setValidationErrors({});
    setError('');
    setSuccess('');
    setModal('create');
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setForm({
      claim_id: item.claim_id ?? '',
      prix: item.prix ?? '',
      methode_paiement: String(item.methode_paiement || INITIAL_FORM.methode_paiement).toLowerCase(),
      status_paiement: String(item.status_paiement || 'pending').toLowerCase(),
      date_paiement: item.date_paiement ? String(item.date_paiement).slice(0, 10) : '',
    });
    setValidationErrors({});
    setError('');
    setSuccess('');
    setModal('edit');
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setError('');
    setSuccess('');
    setModal('delete');
  };

  const closeModal = () => {
    if (submitting || deleting) return;
    setModal(null);
    setSelectedItem(null);
    setForm(INITIAL_FORM);
    setValidationErrors({});
    setError('');
  };

  const handleFormChange = (e, chosenClaim) => {
    const { name, value } = e.target;

    if (name === 'claim_id' && modal === 'create') {
      setForm((prev) => ({
        ...prev,
        claim_id: value,
        prix:
          prev.prix === '' && chosenClaim?.prix_estime != null
            ? chosenClaim.prix_estime
            : prev.prix,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }

    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const saveReimbursement = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setValidationErrors({});

      const payload = {
        claim_id: Number(form.claim_id),
        prix: Number(form.prix),
        methode_paiement: form.methode_paiement,
        status_paiement: form.status_paiement,
        date_paiement: form.date_paiement || null,
      };

      if (modal === 'create') {
        await api.post('/reimbursements', payload);
        setSuccess('Reimbursement issued successfully.');
      } else if (modal === 'edit' && selectedItem) {
        await api.put(`/reimbursements/${selectedItem.id}`, payload);
        setSuccess(`Reimbursement #${selectedItem.id} updated successfully.`);
      }

      setModal(null);
      setSelectedItem(null);
      setForm(INITIAL_FORM);
      await getReimbursements();
    } catch (err) {
      console.error('Failed to save reimbursement:', err);
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError(
          err.response.data.message ||
          'Please correct the validation errors below.'
        );
      } else {
        setError(
          err.response?.data?.message ||
          'Could not save reimbursement.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReimbursement = async () => {
    if (!selectedItem || !canDelete) return;
    try {
      setDeleting(true);
      setError('');

      await api.delete(`/reimbursements/${selectedItem.id}`);

      setModal(null);
      setSelectedItem(null);
      setSuccess('Reimbursement deleted successfully.');
      await getReimbursements();
    } catch (err) {
      console.error('Failed to delete reimbursement:', err);
      setError(
        err.response?.data?.message ||
        'Could not delete reimbursement.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const tableColSpan = (isCustomer ? 6 : 7) + (showActionsColumn ? 1 : 0);

  // =====================================
  // RENDER
  // =====================================
  const { rows: visibleRows, controls: pagination } = useRecordPage(filteredReimbursements);

  return (
    <section className="reimbursements-page dashboard-page" id="reimbursements-section">
      {/* HEADER */}
      <header className="reimbursements-header dashboard-page-header">
        <div>
          <h1 className="reimbursements-title">Reimbursements</h1>
          <p className="reimbursements-subtitle">
            {isCustomer
              ? 'Track compensation payouts and settlement statuses for your approved claims.'
              : 'Issue, monitor, and audit claim settlements and policyholder disbursements.'}
          </p>
        </div>

        <div className="reimbursements-header-actions">
          <button
            type="button"
            className="reimb-btn reimb-btn--secondary"
            onClick={() => getReimbursements(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spin-icon' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {canCreate && (
            <button
              type="button"
              className="reimb-btn reimb-btn--primary"
              onClick={openCreateModal}
            >
              <Plus size={16} />
              Issue Reimbursement
            </button>
          )}
        </div>
      </header>

      {/* ALERTS */}
      {!modal && error && (
        <div className="reimb-alert reimb-alert--error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="reimb-alert-dismiss"
            onClick={() => setError('')}
            aria-label="Dismiss error"
          >
            &times;
          </button>
        </div>
      )}

      {success && (
        <div className="reimb-alert reimb-alert--success" role="status">
          <span>{success}</span>
          <button
            type="button"
            className="reimb-alert-dismiss"
            onClick={() => setSuccess('')}
            aria-label="Dismiss message"
          >
            &times;
          </button>
        </div>
      )}

      {/* KPI STRIP */}
      <div className="reimb-stats-grid">
        <div
          className={`reimb-stat-card dashboard-metric ${statusFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('all')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('all')}
        >
          <span className="reimb-stat-label">Total Payouts</span>
          <strong className="reimb-stat-value">{stats.total}</strong>
        </div>

        <div
          className={`reimb-stat-card dashboard-metric ${statusFilter === 'paid' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('paid')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('paid')}
        >
          <span className="reimb-stat-label">Paid Settlements</span>
          <strong className="reimb-stat-value reimb-stat-value--paid">
            {stats.paid}
          </strong>
        </div>

        <div
          className={`reimb-stat-card dashboard-metric ${statusFilter === 'pending' ? 'is-active' : ''}`}
          onClick={() => setStatusFilter('pending')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('pending')}
        >
          <span className="reimb-stat-label">Pending Disbursement</span>
          <strong className="reimb-stat-value reimb-stat-value--pending">
            {stats.pending}
          </strong>
        </div>

        <div className="reimb-stat-card dashboard-metric">
          <span className="reimb-stat-label">Total Disbursed Value</span>
          <strong className="reimb-stat-value">
            {formatPrice(stats.totalAmount)} <small>MAD</small>
          </strong>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="reimb-toolbar dashboard-toolbar">
        <div className="reimb-search-wrap dashboard-search">
          <Search size={16} />
          <input
            type="text"
            className="reimb-search-input"
            placeholder={
              isCustomer
                ? 'Search by reimbursement ID or claim ID...'
                : 'Search by ID, claim ID, or policyholder...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="reimb-filter-group">
          <select
            className="reimb-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by payment status"
          >
            <option value="all">Status: All</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            className="reimb-filter-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            aria-label="Filter by payment method"
          >
            <option value="all">Method: All</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            className="reimb-filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort reimbursements"
          >
            <option value="newest">Sort: Newest ID</option>
            <option value="oldest">Sort: Oldest ID</option>
            <option value="amount_desc">Sort: Amount (High → Low)</option>
            <option value="amount_asc">Sort: Amount (Low → High)</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="reimb-reset-btn"
              onClick={resetFilters}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* LEDGER SUMMARY BAR */}
      <div className="reimb-ledger-bar">
        <span className="reimb-count-label">
          <strong>{filteredReimbursements.length}</strong> of <strong>{reimbursements.length}</strong> reimbursements match
        </span>
      </div>

      {/* TABLE */}
      <div className="reimb-ledger-card dashboard-panel">
        <div className="reimb-table-responsive">
          <table className="table-reimbursements">
            <thead>
              <tr>
                <th>ID</th>
                <th>Claim</th>
                {!isCustomer && <th>Policyholder</th>}
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Payment Date</th>
                <th>Status</th>
                {showActionsColumn && <th className="text-right">Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={tableColSpan} className="reimb-no-data">
                    Loading reimbursements ledger...
                  </td>
                </tr>
              ) : filteredReimbursements.length > 0 ? (
                visibleRows.map((item) => {
                  const customer = item.claim?.customer?.user;

                  return (
                    <tr key={item.id}>
                      <td className="reimb-id">#{item.id}</td>

                      <td>
                        <span className="reimb-claim-pill">
                          Claim #{item.claim_id}
                        </span>
                      </td>

                      {!isCustomer && (
                        <td>
                          <strong className="reimb-customer-name">
                            {getCustomerName(item)}
                          </strong>
                          {customer?.email && (
                            <span className="reimb-subtext">{customer.email}</span>
                          )}
                        </td>
                      )}

                      <td className="reimb-price">
                        {formatPrice(item.prix)} <span>MAD</span>
                      </td>

                      <td>{formatMethod(item.methode_paiement)}</td>

                      <td>{formatDate(item.date_paiement)}</td>

                      <td>
                        <span
                          className={`reimb-badge reimb-badge--${getStatusClass(
                            item.status_paiement
                          )}`}
                        >
                          {item.status_paiement}
                        </span>
                      </td>

                      {showActionsColumn && (
                        <td className="text-right">
                          <div className="reimb-action-buttons">
                            <button
                              type="button"
                              className="reimb-ledger-btn"
                              onClick={() => openViewModal(item)}
                            >
                              <Eye size={14} />
                              Details
                            </button>

                            {canUpdate && (
                              <button
                                type="button"
                                className="reimb-ledger-btn"
                                onClick={() => openEditModal(item)}
                              >
                                <Pencil size={14} />
                                Modify
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                className="reimb-ledger-btn reimb-ledger-btn--danger"
                                onClick={() => openDeleteModal(item)}
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
                  <td colSpan={tableColSpan} className="reimb-no-data">
                    {hasActiveFilters
                      ? 'No reimbursements match your current filters.'
                      : 'No reimbursements recorded in the ledger.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <RecordPagination {...pagination} />
      </div>

      {/* =====================================
          DETAILS MODAL (Agent only, Portal)
         ===================================== */}
      {modal === 'view' &&
        selectedItem &&
        showActionsColumn &&
        createPortal(
          <div className="reimb-modal-overlay dashboard-dialog" onClick={closeModal}>
            <div
              className="reimb-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="reimb-modal-header">
                <div>
                  <span className="reimb-modal-eyebrow">
                    RECORD #{selectedItem.id}
                  </span>
                  <h2>Reimbursement Details</h2>
                  <p>
                    Settlement summary for Claim #{selectedItem.claim_id}.
                  </p>
                </div>

                <button
                  type="button"
                  className="reimb-modal-close"
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="reimb-modal-grid">
                <div className="reimb-info-field">
                  <span>Claim Reference</span>
                  <strong>Claim #{selectedItem.claim_id}</strong>
                </div>

                <div className="reimb-info-field">
                  <span>Policyholder</span>
                  <strong>{getCustomerName(selectedItem)}</strong>
                </div>

                <div className="reimb-info-field">
                  <span>Disbursed Amount</span>
                  <strong>{formatPrice(selectedItem.prix)} MAD</strong>
                </div>

                <div className="reimb-info-field">
                  <span>Payment Method</span>
                  <strong>{formatMethod(selectedItem.methode_paiement)}</strong>
                </div>

                <div className="reimb-info-field">
                  <span>Payment Date</span>
                  <strong>{formatDate(selectedItem.date_paiement)}</strong>
                </div>

                <div className="reimb-info-field">
                  <span>Payment Status</span>
                  <div>
                    <span
                      className={`reimb-badge reimb-badge--${getStatusClass(
                        selectedItem.status_paiement
                      )}`}
                    >
                      {selectedItem.status_paiement}
                    </span>
                  </div>
                </div>

                <div className="reimb-info-field">
                  <span>Assigned Agent</span>
                  <strong>{getAgentName(selectedItem)}</strong>
                </div>
              </div>

              <div className="reimb-modal-actions">
                <button
                  type="button"
                  className="reimb-btn reimb-btn--secondary"
                  onClick={closeModal}
                >
                  Close
                </button>

                {canUpdate && (
                  <button
                    type="button"
                    className="reimb-btn reimb-btn--primary"
                    onClick={() => openEditModal(selectedItem)}
                  >
                    Modify Reimbursement
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* =====================================
          CREATE / MODIFY MODAL (Agent only, Portal)
         ===================================== */}
      {(modal === 'create' || modal === 'edit') &&
        (canCreate || canUpdate) &&
        createPortal(
          <div className="reimb-modal-overlay dashboard-dialog" onClick={closeModal}>
            <div
              className="reimb-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="reimb-modal-header">
                <div>
                  <span className="reimb-modal-eyebrow">
                    {modal === 'create'
                      ? 'NEW SETTLEMENT'
                      : `RECORD #${selectedItem?.id}`}
                  </span>
                  <h2>
                    {modal === 'create'
                      ? 'Issue Reimbursement'
                      : 'Modify Reimbursement'}
                  </h2>
                  <p>
                    {modal === 'create'
                      ? 'Select an approved claim and enter the settlement payment details.'
                      : 'Update the settlement amount, payment method, or status.'}
                  </p>
                </div>

                <button
                  type="button"
                  className="reimb-modal-close"
                  onClick={closeModal}
                  disabled={submitting}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form className="reimb-form" onSubmit={saveReimbursement}>
                {error && (
                  <div className="reimb-alert reimb-alert--error reimb-alert--inline">
                    <span>{error}</span>
                  </div>
                )}

                <div className="reimb-form-group">
                  <label htmlFor="claim_id">Approved Claim</label>
                  <RecordSelect
                    label="Approved claim"
                    name="claim_id"
                    path="/claims"
                    value={form.claim_id}
                    onChange={handleFormChange}
                    reimbursable
                    initialOption={modal === 'edit' ? selectedItem?.claim : undefined}
                    formatOption={(claim) => {
                      const customer = claim.customer?.user;
                      const customerLabel = customer
                        ? `${customer.first_name} ${customer.last_name}`
                        : 'Customer';
                      return `Claim #${claim.id} — ${customerLabel} (Est. ${formatPrice(claim.prix_estime)} MAD)`;
                    }}
                  />
                  {validationErrors.claim_id && (
                    <span className="reimb-field-error">
                      {validationErrors.claim_id[0]}
                    </span>
                  )}
                </div>

                <div className="reimb-form-row">
                  <div className="reimb-form-group">
                    <label htmlFor="prix">Amount (MAD)</label>
                    <input
                      id="prix"
                      name="prix"
                      type="number"
                      value={form.prix}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    {validationErrors.prix && (
                      <span className="reimb-field-error">
                        {validationErrors.prix[0]}
                      </span>
                    )}
                  </div>

                  <div className="reimb-form-group">
                    <label htmlFor="date_paiement">Payment Date</label>
                    <input
                      id="date_paiement"
                      name="date_paiement"
                      type="date"
                      value={form.date_paiement}
                      onChange={handleFormChange}
                    />
                    {validationErrors.date_paiement && (
                      <span className="reimb-field-error">
                        {validationErrors.date_paiement[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="reimb-form-row">
                  <div className="reimb-form-group">
                    <label htmlFor="methode_paiement">Payment Method</label>
                    <select
                      id="methode_paiement"
                      name="methode_paiement"
                      value={form.methode_paiement}
                      onChange={handleFormChange}
                      required
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    {validationErrors.methode_paiement && (
                      <span className="reimb-field-error">
                        {validationErrors.methode_paiement[0]}
                      </span>
                    )}
                  </div>

                  <div className="reimb-form-group">
                    <label htmlFor="status_paiement">Payment Status</label>
                    <select
                      id="status_paiement"
                      name="status_paiement"
                      value={form.status_paiement}
                      onChange={handleFormChange}
                      required
                    >
                      {PAYMENT_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                    {validationErrors.status_paiement && (
                      <span className="reimb-field-error">
                        {validationErrors.status_paiement[0]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="reimb-modal-actions">
                  <button
                    type="button"
                    className="reimb-btn reimb-btn--secondary"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="reimb-btn reimb-btn--primary"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Saving...'
                      : modal === 'create'
                      ? 'Issue Reimbursement'
                      : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* =====================================
          DELETE MODAL (Agent only, Portal)
         ===================================== */}
      {modal === 'delete' &&
        selectedItem &&
        canDelete &&
        createPortal(
          <div className="reimb-modal-overlay dashboard-dialog" onClick={closeModal}>
            <div
              className="reimb-modal reimb-modal--delete"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="reimb-modal-header">
                <div>
                  <span className="reimb-modal-eyebrow">CONFIRM REMOVAL</span>
                  <h2>Delete Reimbursement</h2>
                  <p>
                    Are you sure you want to remove this reimbursement record?
                    This action cannot be undone.
                  </p>
                </div>

                <button
                  type="button"
                  className="reimb-modal-close"
                  onClick={closeModal}
                  disabled={deleting}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="delete-reimb-box">
                <strong>
                  Reimbursement #{selectedItem.id} •{' '}
                  {formatPrice(selectedItem.prix)} MAD
                </strong>
                <span>
                  Claim #{selectedItem.claim_id} •{' '}
                  {formatMethod(selectedItem.methode_paiement)} • Status:{' '}
                  {selectedItem.status_paiement}
                </span>
              </div>

              {error && (
                <div className="reimb-alert reimb-alert--error reimb-alert--inline">
                  <span>{error}</span>
                </div>
              )}

              <div className="reimb-modal-actions">
                <button
                  type="button"
                  className="reimb-btn reimb-btn--secondary"
                  onClick={closeModal}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="reimb-btn reimb-btn--danger"
                  onClick={deleteReimbursement}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Reimbursement'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}

export default Reimbursements;
