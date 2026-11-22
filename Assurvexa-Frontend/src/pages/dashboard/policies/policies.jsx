import { Search } from 'lucide-react';
import { useDashboardRecords, useRecordPage } from '../useDashboardRecords';
import RecordPagination from '../RecordPagination';
import { useAuth } from '../../../context/useAuth';
import { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { can } from '../../../services/permissions';
import './policies.css';

const POLICY_TYPES = [
  { value: 'automobile', label: 'Automobile' },
  { value: 'habitation', label: 'Habitation' },
  { value: 'sante', label: 'Santé' },
  { value: 'vie', label: 'Vie' },
  { value: 'professionnelle', label: 'Professionnelle' },
  { value: 'voyage', label: 'Voyage' },
];

const TYPE_LABEL_MAP = POLICY_TYPES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const INITIAL_FORM = {
  nom: '',
  description: '',
  type: '',
  prix: '',
};

function Policies({ role: propRole }) {
  const { user } = useAuth();
  const role = propRole ?? user?.role;
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all'); // 'all' | 'nom' | 'description'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | POLICY_TYPES values
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'

  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [policyForm, setPolicyForm] = useState(INITIAL_FORM);
  const [validationErrors, setValidationErrors] = useState({});

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  // READ POLICIES
  const { records: policies, loading, refreshing, reload: getPolicies } =
    useDashboardRecords('/policies', setError);

  // FILTERED & SORTED POLICIES
  const filteredPolicies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return policies
      .filter((policy) => {
        const nom = (policy.nom || '').toLowerCase();
        const description = (policy.description || '').toLowerCase();
        const type = (policy.type || '').toLowerCase();
        const typeLabel = (TYPE_LABEL_MAP[policy.type] || '').toLowerCase();
        const idStr = String(policy.id || '');

        // 1. Search Query Check
        if (query) {
          if (searchField === 'nom' && !nom.includes(query)) return false;
          if (searchField === 'description' && !description.includes(query)) return false;
          if (searchField === 'all') {
            const matchesAny =
              nom.includes(query) ||
              description.includes(query) ||
              type.includes(query) ||
              typeLabel.includes(query) ||
              idStr.includes(query);
            if (!matchesAny) return false;
          }
        }

        // 2. Policy Type Filter
        if (typeFilter !== 'all' && policy.type !== typeFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
        if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);
        if (sortBy === 'name_asc') return (a.nom || '').localeCompare(b.nom || '');
        if (sortBy === 'name_desc') return (b.nom || '').localeCompare(a.nom || '');
        if (sortBy === 'price_asc') return Number(a.prix || 0) - Number(b.prix || 0);
        if (sortBy === 'price_desc') return Number(b.prix || 0) - Number(a.prix || 0);
        return 0;
      });
  }, [policies, searchQuery, searchField, typeFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    searchField !== 'all' ||
    typeFilter !== 'all' ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSearchField('all');
    setTypeFilter('all');
    setSortBy('newest');
  };

  // FORM HANDLING
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPolicyForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
    setError('');
  };

  const openCreateModal = () => {
    setPolicyForm(INITIAL_FORM);
    setSelectedPolicy(null);
    setValidationErrors({});
    setError('');
    setSuccess('');
    setModal('create');
  };

  const openEditModal = (policy) => {
    setSelectedPolicy(policy);
    setPolicyForm({
      nom: policy.nom ?? '',
      description: policy.description ?? '',
      type: policy.type ?? '',
      prix: policy.prix ?? '',
    });
    setValidationErrors({});
    setError('');
    setSuccess('');
    setModal('edit');
  };

  const openDeleteModal = (policy) => {
    setSelectedPolicy(policy);
    setError('');
    setSuccess('');
    setModal('delete');
  };

  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setSelectedPolicy(null);
    setPolicyForm(INITIAL_FORM);
    setValidationErrors({});
    setError('');
  };

  // CREATE / UPDATE POLICY
  const addOrUpdatePolicy = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setValidationErrors({});

      const payload = {
        ...policyForm,
        prix: Number(policyForm.prix),
      };

      if (modal === 'create') {
        await api.post('/policies', payload);
        setSuccess('Policy created successfully.');
      } else if (modal === 'edit' && selectedPolicy) {
        await api.put(`/policies/${selectedPolicy.id}`, payload);
        setSuccess('Policy updated successfully.');
      }

      setModal(null);
      setPolicyForm(INITIAL_FORM);
      setSelectedPolicy(null);
      await getPolicies();
    } catch (err) {
      console.error('Failed to save policy:', err);

      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please correct the validation errors below.');
      } else {
        setError(err.response?.data?.message || 'Could not save the policy.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE POLICY
  const deletePolicy = async () => {
    if (!selectedPolicy) return;

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
      setError(err.response?.data?.message || 'Could not delete the policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = can(role, 'policies', 'create');
  const canUpdate = can(role, 'policies', 'update');
  const canDelete = can(role, 'policies', 'delete');
  const hasRowActions = canUpdate || canDelete;

  const { rows: visibleRows, controls: pagination } = useRecordPage(filteredPolicies);

  return (
    <section className="policies-section dashboard-page" id="policies-section">
      <div className="container">
        {/* HEADER */}
        <header className="policies-header dashboard-page-header">
          <div>
            <h1 className="policies-title">Insurance Policies</h1>
            <p className="policies-subtitle">
              Configure, review, and manage available insurance plans, coverage types, and base premiums.
            </p>
          </div>

          <div className="policies-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => getPolicies(true)}
              disabled={loading || refreshing}
              title="Refresh policies list"
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
                + Add Policy
              </button>
            )}
          </div>
        </header>

        {/* FEEDBACK */}
        {!modal && error && (
          <div className="policies-alert policies-alert--error" role="alert">
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
          <div className="policies-alert policies-alert--success" role="status">
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

        {/* SEARCH & FILTER TOOLBAR */}
        <div className="policies-toolbar dashboard-toolbar">
          <div className="policies-search-group">
            <select
              className="form-control policies-field-select"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              aria-label="Search by field"
            >
              <option value="all">All Fields</option>
              <option value="nom">Policy Name</option>
              <option value="description">Description</option>
            </select>

            <div className="policies-search-input-wrap dashboard-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                className="form-control policies-search-input"
                placeholder={`Search by ${
                  searchField === 'all'
                    ? 'policy name, description, type, or ID...'
                    : searchField === 'nom'
                    ? 'policy name...'
                    : 'description...'
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

          <div className="policies-filter-group">
            <select
              className="form-control policies-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by policy type"
            >
              <option value="all">Type: All Policies</option>
              {POLICY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <select
              className="form-control policies-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort policies"
            >
              <option value="newest">Sort: Newest ID</option>
              <option value="oldest">Sort: Oldest ID</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
              <option value="name_desc">Sort: Name (Z–A)</option>
              <option value="price_asc">Sort: Price (Low → High)</option>
              <option value="price_desc">Sort: Price (High → Low)</option>
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
        <div className="policies-ledger-bar">
          <span className="policies-count-label">
            <strong>{filteredPolicies.length}</strong> of <strong>{policies.length}</strong> policies match
          </span>
        </div>

        {/* POLICIES TABLE */}
        <div className="policies-ledger-card dashboard-panel">
          <div className="table-responsive">
            <table className="table-policies">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Policy Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Base Price</th>
                  {hasRowActions && <th className="text-right">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={hasRowActions ? 6 : 5} className="no-data">
                      Loading policies catalog...
                    </td>
                  </tr>
                ) : filteredPolicies.length > 0 ? (
                  visibleRows.map((policy) => (
                    <tr key={policy.id}>
                      <td className="policy-id">#{policy.id}</td>

                      <td>
                        <strong className="policy-name">{policy.nom}</strong>
                      </td>

                      <td className="policy-description">
                        {policy.description || (
                          <span className="policy-subtext">No description provided</span>
                        )}
                      </td>

                      <td>
                        <span className="badge--neutral">
                          {TYPE_LABEL_MAP[policy.type] || policy.type}
                        </span>
                      </td>

                      <td className="policy-price">
                        {Number(policy.prix).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        <span>MAD</span>
                      </td>

                      {hasRowActions && (
                        <td className="text-right">
                          <div className="action-buttons">
                            {canUpdate && (
                              <button
                                type="button"
                                className="btn-ledger"
                                onClick={() => openEditModal(policy)}
                              >
                                Modify
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                className="btn-ledger btn-ledger--danger"
                                onClick={() => openDeleteModal(policy)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={hasRowActions ? 6 : 5} className="no-data">
                      {hasActiveFilters
                        ? 'No policies match your current search or filter criteria.'
                        : 'No policies found in the catalog.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <RecordPagination {...pagination} />
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="policy-modal-overlay dashboard-dialog" onClick={closeModal}>
          <div
            className="policy-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="policy-modal-header">
              <div>
                <span className="eyebrow">
                  {modal === 'create' ? 'New Coverage Plan' : `Record #${selectedPolicy?.id}`}
                </span>
                <h2>{modal === 'create' ? 'Create Policy' : 'Modify Policy'}</h2>
                <p>
                  {modal === 'create'
                    ? 'Add a new insurance policy to the catalog.'
                    : 'Update the policy coverage details and base premium.'}
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

            <form className="policy-modal-form" onSubmit={addOrUpdatePolicy}>
              <div className="policy-form-group">
                <label htmlFor="nom">Policy Name</label>
                <input
                  id="nom"
                  className="form-control"
                  type="text"
                  name="nom"
                  value={policyForm.nom}
                  onChange={handleChange}
                  placeholder="e.g. Tous Risques Premium"
                  required
                />
                {validationErrors.nom && (
                  <span className="field-error">{validationErrors.nom[0]}</span>
                )}
              </div>

              <div className="policy-form-row">
                <div className="policy-form-group">
                  <label htmlFor="type">Policy Type</label>
                  <select
                    id="type"
                    className="form-control"
                    name="type"
                    value={policyForm.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select a coverage type
                    </option>
                    {POLICY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors.type && (
                    <span className="field-error">{validationErrors.type[0]}</span>
                  )}
                </div>

                <div className="policy-form-group">
                  <label htmlFor="prix">Base Price (MAD)</label>
                  <input
                    id="prix"
                    className="form-control"
                    type="number"
                    name="prix"
                    value={policyForm.prix}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  {validationErrors.prix && (
                    <span className="field-error">{validationErrors.prix[0]}</span>
                  )}
                </div>
              </div>

              <div className="policy-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-control policy-textarea"
                  name="description"
                  value={policyForm.description}
                  onChange={handleChange}
                  placeholder="Describe what this policy covers, deductibles, and conditions..."
                  rows="4"
                  required
                />
                {validationErrors.description && (
                  <span className="field-error">{validationErrors.description[0]}</span>
                )}
              </div>

              {error && (
                <div className="policies-alert policies-alert--error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <div className="policy-modal-actions">
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
        <div className="policy-modal-overlay dashboard-dialog" onClick={closeModal}>
          <div
            className="policy-modal policy-modal--delete"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="policy-modal-header">
              <div>
                <span className="eyebrow">Confirm Removal</span>
                <h2>Delete Policy</h2>
                <p>
                  Are you sure you want to remove this policy from the catalog?
                  This action cannot be undone.
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

            {selectedPolicy && (
              <div className="delete-policy-box">
                <strong>{selectedPolicy.nom}</strong>
                <span>
                  #{selectedPolicy.id} •{' '}
                  {TYPE_LABEL_MAP[selectedPolicy.type] || selectedPolicy.type} •{' '}
                  {Number(selectedPolicy.prix).toLocaleString()} MAD
                </span>
              </div>
            )}

            {error && (
              <div className="policies-alert policies-alert--error" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="policy-modal-actions">
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
