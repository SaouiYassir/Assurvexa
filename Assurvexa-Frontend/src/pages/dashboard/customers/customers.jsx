import { Search } from 'lucide-react';
import { useDashboardRecords, useRecordPage } from '../useDashboardRecords';
import RecordPagination from '../RecordPagination';
import { useAuth } from '../../../context/useAuth';
import { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { can } from '../../../services/permissions';
import './customers.css';

const INITIAL_CREATE_FORM = {
  first_name: '',
  last_name: '',
  username: '',
  CIN: '',
  adresse: '',
  phone: '',
  email: '',
  password: '',
  password_confirmation: '',
};

const INITIAL_EDIT_FORM = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: '',
  CIN: '',
  adresse: '',
};

function Customers({ role: propRole }) {
  const { user } = useAuth();
  const role = propRole ?? user?.role;
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all'); // 'all' | 'name' | 'cin' | 'email' | 'phone' | 'adresse'
  const [profileFilter, setProfileFilter] = useState('all'); // 'all' | 'with_address' | 'missing_address' | 'missing_cin'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name_asc' | 'name_desc'

  const [modal, setModal] = useState(null); // 'create' | 'modify' | 'delete' | null
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [validationErrors, setValidationErrors] = useState({});

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConf, setShowPasswordConf] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modal]);

  // FETCH CUSTOMERS
  const { records: customers, loading, refreshing, reload: getCustomers } =
    useDashboardRecords('/customers', setError);

  // FILTERED & SORTED CUSTOMERS
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const user = customer.user || {};
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const username = (user.username || '').toLowerCase();
        const cin = (user.CIN || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const address = (customer.adresse || customer.address || '').toLowerCase();
        const idStr = String(customer.id || '');

        if (query) {
          if (searchField === 'name' && !fullName.includes(query)) return false;
          if (searchField === 'cin' && !cin.includes(query)) return false;
          if (searchField === 'email' && !email.includes(query)) return false;
          if (searchField === 'phone' && !phone.includes(query)) return false;
          if (searchField === 'adresse' && !address.includes(query)) return false;
          if (searchField === 'all') {
            const matchesAny =
              fullName.includes(query) ||
              username.includes(query) ||
              cin.includes(query) ||
              email.includes(query) ||
              phone.includes(query) ||
              address.includes(query) ||
              idStr.includes(query);
            if (!matchesAny) return false;
          }
        }

        if (profileFilter === 'with_address' && !address.trim()) return false;
        if (profileFilter === 'missing_address' && address.trim()) return false;
        if (profileFilter === 'missing_cin' && cin.trim()) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.id || 0) - (a.id || 0);
        if (sortBy === 'oldest') return (a.id || 0) - (b.id || 0);

        const nameA = `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.trim();
        const nameB = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim();

        if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name_desc') return nameB.localeCompare(nameA);
        return 0;
      });
  }, [customers, searchQuery, searchField, profileFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    searchField !== 'all' ||
    profileFilter !== 'all' ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSearchField('all');
    setProfileFilter('all');
    setSortBy('newest');
  };

  // CLOSE MODAL
  const closeModal = () => {
    if (submitting) return;
    setModal(null);
    setSelectedCustomer(null);
    setError('');
    setValidationErrors({});
    setShowPassword(false);
    setShowPasswordConf(false);
  };

  // OPEN CREATE MODAL
  const openCreateModal = () => {
    setCreateForm(INITIAL_CREATE_FORM);
    setSelectedCustomer(null);
    setError('');
    setSuccess('');
    setValidationErrors({});
    setShowPassword(false);
    setShowPasswordConf(false);
    setModal('create');
  };

  // OPEN MODIFY MODAL
  const openModifyModal = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      first_name: customer.user?.first_name || '',
      last_name: customer.user?.last_name || '',
      username: customer.user?.username || '',
      email: customer.user?.email || '',
      phone: customer.user?.phone || '',
      CIN: customer.user?.CIN || '',
      adresse: customer.adresse || customer.address || '',
    });
    setError('');
    setSuccess('');
    setValidationErrors({});
    setModal('modify');
  };

  // OPEN DELETE MODAL
  const openDeleteModal = (customer) => {
    setSelectedCustomer(customer);
    setError('');
    setSuccess('');
    setModal('delete');
  };

  // HANDLE CREATE FORM CHANGES
  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  // HANDLE EDIT FORM CHANGES
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  // CREATE CUSTOMER
  const createCustomer = async (e) => {
    e.preventDefault();

    if (createForm.password !== createForm.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setValidationErrors({});

      await api.post('/customers', createForm);

      setModal(null);
      setCreateForm(INITIAL_CREATE_FORM);
      await getCustomers();
      setSuccess('Customer created successfully.');
    } catch (err) {
      console.error('Failed to create customer:', err);
      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please correct the validation errors below.');
      } else {
        setError(err.response?.data?.message || 'Could not create customer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // UPDATE CUSTOMER
  const updateCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      setSubmitting(true);
      setError('');
      setValidationErrors({});

      await api.put(`/customers/${selectedCustomer.id}`, editForm);

      setModal(null);
      setSelectedCustomer(null);
      await getCustomers();
      setSuccess('Customer updated successfully.');
    } catch (err) {
      console.error('Failed to update customer:', err);

      if (err.response?.status === 422) {
        setValidationErrors(err.response.data.errors || {});
        setError('Please correct the validation errors below.');
      } else {
        setError(err.response?.data?.message || 'Could not update customer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE CUSTOMER
  const deleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setSubmitting(true);
      setError('');

      await api.delete(`/customers/${selectedCustomer.id}`);

      setModal(null);
      setSelectedCustomer(null);
      await getCustomers();
      setSuccess('Customer deleted successfully.');
    } catch (err) {
      console.error('Failed to delete customer:', err);

      if (err.response?.status === 409) {
        setError(err.response.data.message || 'Customer deletion is not enabled.');
      } else {
        setError(err.response?.data?.message || 'Could not delete customer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = can(role, 'customers', 'create');
  const canUpdate = can(role, 'customers', 'update');
  const canDelete = can(role, 'customers', 'delete');
  const hasRowActions = canUpdate || canDelete;

  const { rows: visibleRows, controls: pagination } = useRecordPage(filteredCustomers);

  return (
    <section className="customers-section dashboard-page" id="customers-section">
      <div className="container">
        {/* HEADER */}
        <header className="customers-header dashboard-page-header">
          <div>
            <h1 className="customers-title">{role === 'customer' ? 'My Profile' : 'Customer Directory'}</h1>
            <p className="customers-subtitle">
              {role === 'customer' ? 'View and update your account details.' : 'Manage policyholders and their contact records.'}
            </p>
          </div>

          <div className="customers-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => getCustomers(true)}
              disabled={loading || refreshing}
              title="Refresh customers list"
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
                + Add Customer
              </button>
            )}
          </div>
        </header>

        {/* FEEDBACK */}
        {!modal && error && (
          <div className="customers-alert customers-alert--error" role="alert">
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
          <div className="customers-alert customers-alert--success" role="status">
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
        <div className="customers-toolbar dashboard-toolbar">
          <div className="customers-search-group">
            <select
              className="form-control customers-field-select"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              aria-label="Search by field"
            >
              <option value="all">All Fields</option>
              <option value="name">Full Name</option>
              <option value="cin">CIN</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="adresse">Address</option>
            </select>

            <div className="customers-search-input-wrap dashboard-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                className="form-control customers-search-input"
                placeholder={`Search by ${
                  searchField === 'all'
                    ? 'name, CIN, email, phone, address, or ID...'
                    : searchField === 'adresse'
                    ? 'address...'
                    : searchField.toUpperCase() + '...'
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

          <div className="customers-filter-group">
            <select
              className="form-control customers-filter-select"
              value={profileFilter}
              onChange={(e) => setProfileFilter(e.target.value)}
              aria-label="Filter by profile records"
            >
              <option value="all">Records: All Customers</option>
              <option value="with_address">With Address</option>
              <option value="missing_address">Missing Address</option>
              <option value="missing_cin">Missing CIN</option>
            </select>

            <select
              className="form-control customers-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort customers"
            >
              <option value="newest">Sort: Newest ID</option>
              <option value="oldest">Sort: Oldest ID</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
              <option value="name_desc">Sort: Name (Z–A)</option>
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
        <div className="customers-ledger-bar">
          <span className="customers-count-label">
            <strong>{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers match
          </span>
        </div>

        {/* CUSTOMERS TABLE */}
        <div className="customers-ledger-card dashboard-panel">
          <div className="table-responsive">
            <table className="table-customers">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>CIN</th>
                  <th>Contact</th>
                  <th>Address</th>
                  {hasRowActions && <th className="text-right">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={hasRowActions ? 6 : 5} className="no-data">
                      Loading customers registry...
                    </td>
                  </tr>
                ) : filteredCustomers.length > 0 ? (
                  visibleRows.map((customer) => {
                    const addressValue = customer.adresse || customer.address;

                    return (
                      <tr key={customer.id}>
                        <td className="customer-id">#{customer.id}</td>

                        <td>
                          <strong className="customer-name">
                            {customer.user?.first_name} {customer.user?.last_name}
                          </strong>
                          {customer.user?.username && (
                            <span className="customer-subtext">
                              @{customer.user.username}
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="badge--neutral">
                            {customer.user?.CIN || '—'}
                          </span>
                        </td>

                        <td>
                          <span>{customer.user?.email || 'N/A'}</span>
                          {customer.user?.phone && (
                            <span className="customer-subtext">
                              {customer.user.phone}
                            </span>
                          )}
                        </td>

                        <td className="customer-address">
                          {addressValue || (
                            <span className="customer-subtext">Not provided</span>
                          )}
                        </td>

                        {hasRowActions && (
                          <td className="text-right">
                            <div className="action-buttons">
                              {canUpdate && (
                                <button
                                  type="button"
                                  className="btn-ledger"
                                  onClick={() => openModifyModal(customer)}
                                >
                                  Modify
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  className="btn-ledger btn-ledger--danger"
                                  onClick={() => openDeleteModal(customer)}
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
                    <td colSpan={hasRowActions ? 6 : 5} className="no-data">
                      {hasActiveFilters
                        ? 'No customers match your current search or filter criteria.'
                        : 'No customers found in the registry.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <RecordPagination {...pagination} />
        </div>
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {modal === 'create' && (
        <div className="customer-modal-overlay dashboard-dialog" onClick={closeModal}>
          <div
            className="customer-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="customer-modal-header">
              <div>
                <span className="eyebrow">New Policyholder</span>
                <h2>Register Customer</h2>
                <p>Create a new policyholder account and profile record.</p>
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

            <form className="customer-modal-form" onSubmit={createCustomer}>
              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label htmlFor="create_first_name">First Name</label>
                  <input
                    id="create_first_name"
                    className="form-control"
                    type="text"
                    name="first_name"
                    value={createForm.first_name}
                    onChange={handleCreateChange}
                    required
                  />
                  {validationErrors.first_name && (
                    <span className="field-error">{validationErrors.first_name[0]}</span>
                  )}
                </div>

                <div className="customer-form-group">
                  <label htmlFor="create_last_name">Last Name</label>
                  <input
                    id="create_last_name"
                    className="form-control"
                    type="text"
                    name="last_name"
                    value={createForm.last_name}
                    onChange={handleCreateChange}
                    required
                  />
                  {validationErrors.last_name && (
                    <span className="field-error">{validationErrors.last_name[0]}</span>
                  )}
                </div>
              </div>

              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label htmlFor="create_username">Username</label>
                  <input
                    id="create_username"
                    className="form-control"
                    type="text"
                    name="username"
                    value={createForm.username}
                    onChange={handleCreateChange}
                    required
                  />
                  {validationErrors.username && (
                    <span className="field-error">{validationErrors.username[0]}</span>
                  )}
                </div>

                <div className="customer-form-group">
                  <label htmlFor="create_CIN">National ID (CIN)</label>
                  <input
                    id="create_CIN"
                    className="form-control"
                    type="text"
                    name="CIN"
                    value={createForm.CIN}
                    onChange={handleCreateChange}
                    required
                  />
                  {validationErrors.CIN && (
                    <span className="field-error">{validationErrors.CIN[0]}</span>
                  )}
                </div>
              </div>

              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label htmlFor="create_phone">Phone Number</label>
                  <input
                    id="create_phone"
                    className="form-control"
                    type="tel"
                    name="phone"
                    value={createForm.phone}
                    onChange={handleCreateChange}
                    placeholder="+212 6XX XXX XXX"
                    required
                  />
                  {validationErrors.phone && (
                    <span className="field-error">{validationErrors.phone[0]}</span>
                  )}
                </div>

                <div className="customer-form-group">
                  <label htmlFor="create_email">Email Address</label>
                  <input
                    id="create_email"
                    className="form-control"
                    type="email"
                    name="email"
                    value={createForm.email}
                    onChange={handleCreateChange}
                    required
                  />
                  {validationErrors.email && (
                    <span className="field-error">{validationErrors.email[0]}</span>
                  )}
                </div>
              </div>

              <div className="customer-form-group">
                <label htmlFor="create_adresse">Address</label>
                <textarea
                  id="create_adresse"
                  className="form-control customer-textarea"
                  name="adresse"
                  rows="2"
                  value={createForm.adresse}
                  onChange={handleCreateChange}
                  placeholder="Street address, city, postal code..."
                  required
                />
                {validationErrors.adresse && (
                  <span className="field-error">{validationErrors.adresse[0]}</span>
                )}
              </div>

              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label htmlFor="create_password">Password</label>
                  <div className="customer-password-wrapper">
                    <input
                      id="create_password"
                      className="form-control"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={createForm.password}
                      onChange={handleCreateChange}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <span className="field-error">{validationErrors.password[0]}</span>
                  )}
                </div>

                <div className="customer-form-group">
                  <label htmlFor="create_password_confirmation">Confirm Password</label>
                  <div className="customer-password-wrapper">
                    <input
                      id="create_password_confirmation"
                      className="form-control"
                      type={showPasswordConf ? 'text' : 'password'}
                      name="password_confirmation"
                      value={createForm.password_confirmation}
                      onChange={handleCreateChange}
                      placeholder="Re-enter password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPasswordConf((prev) => !prev)}
                    >
                      {showPasswordConf ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="customers-alert customers-alert--error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <div className="customer-modal-actions">
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
                  {submitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modal === 'delete' && (
        <div className="customer-modal-overlay dashboard-dialog" onClick={closeModal}>
          <div
            className="customer-modal customer-modal--delete"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="customer-modal-header">
              <div>
                <span className="eyebrow">Confirm Removal</span>
                <h2>Delete Customer</h2>
                <p>
                  Are you sure you want to delete this customer? This action
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

            {selectedCustomer && (
              <div className="delete-customer-box">
                <strong>
                  {selectedCustomer.user?.first_name}{' '}
                  {selectedCustomer.user?.last_name}
                </strong>
                <span>
                  #{selectedCustomer.id} • {selectedCustomer.user?.email}
                </span>
              </div>
            )}

            {error && (
              <div className="customers-alert customers-alert--error" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="customer-modal-actions">
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
                onClick={deleteCustomer}
                disabled={submitting}
              >
                {submitting ? 'Deleting...' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODIFY CUSTOMER MODAL */}
      {modal === 'modify' && (
        <div className="customer-modal-overlay dashboard-dialog" onClick={closeModal}>
          <div
            className="customer-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="customer-modal-header">
              <div>
                <span className="eyebrow">Record #{selectedCustomer?.id}</span>
                <h2>Modify Customer</h2>
                <p>Update the customer&apos;s personal and contact information.</p>
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

            <form className="customer-modal-form" onSubmit={updateCustomer}>
              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    id="first_name"
                    className="form-control"
                    type="text"
                    name="first_name"
                    value={editForm.first_name}
                    onChange={handleEditChange}
                    required
                  />
                  {validationErrors.first_name && (
                    <span className="field-error">
                      {validationErrors.first_name[0]}
                    </span>
                  )}
                </div>

                <div className="customer-form-group">
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    className="form-control"
                    type="text"
                    name="last_name"
                    value={editForm.last_name}
                    onChange={handleEditChange}
                    required
                  />
                  {validationErrors.last_name && (
                    <span className="field-error">
                      {validationErrors.last_name[0]}
                    </span>
                  )}
                </div>
              </div>

              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    className="form-control"
                    type="text"
                    name="username"
                    value={editForm.username}
                    onChange={handleEditChange}
                    required
                  />
                  {validationErrors.username && (
                    <span className="field-error">
                      {validationErrors.username[0]}
                    </span>
                  )}
                </div>

                <div className="customer-form-group">
                  <label htmlFor="CIN">National ID (CIN)</label>
                  <input
                    id="CIN"
                    className="form-control"
                    type="text"
                    name="CIN"
                    value={editForm.CIN}
                    onChange={handleEditChange}
                  />
                  {validationErrors.CIN && (
                    <span className="field-error">
                      {validationErrors.CIN[0]}
                    </span>
                  )}
                </div>
              </div>

              <div className="customer-form-row">
                <div className="customer-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    className="form-control"
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                  />
                  {validationErrors.phone && (
                    <span className="field-error">
                      {validationErrors.phone[0]}
                    </span>
                  )}
                </div>

                <div className="customer-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    className="form-control"
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    required
                  />
                  {validationErrors.email && (
                    <span className="field-error">
                      {validationErrors.email[0]}
                    </span>
                  )}
                </div>
              </div>

              <div className="customer-form-group">
                <label htmlFor="adresse">Address</label>
                <textarea
                  id="adresse"
                  className="form-control customer-textarea"
                  name="adresse"
                  rows="3"
                  value={editForm.adresse}
                  onChange={handleEditChange}
                  placeholder="Street address, city, postal code..."
                />
                {validationErrors.adresse && (
                  <span className="field-error">
                    {validationErrors.adresse[0]}
                  </span>
                )}
              </div>

              {error && (
                <div className="customers-alert customers-alert--error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <div className="customer-modal-actions">
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
                  {submitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default Customers;
