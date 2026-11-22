import { Search } from 'lucide-react';
import { useDashboardRecords, useRecordPage } from '../useDashboardRecords';
import RecordPagination from '../RecordPagination';
import { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { can } from '../../../services/permissions';
import './agents.css';

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  username: '',
  CIN: '',
  phone: '',
  email: '',
  password: '',
  password_confirmation: '',
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function Agents({ role = 'admin' }) {
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('all'); // 'all' | 'name' | 'cin' | 'email' | 'phone' | 'username'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'this_month' | 'this_year' | 'older'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'name_asc' | 'name_desc'

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
  const { records: agents, loading, refreshing, reload: getAgents } =
    useDashboardRecords('/agents', setError);

  // FILTERED & SORTED AGENTS
  const filteredAgents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return agents
      .filter((agent) => {
        const user = agent.user || {};
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const username = (user.username || '').toLowerCase();
        const cin = (user.CIN || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const idStr = String(agent.id || '');

        // 1. Search Query Check
        if (query) {
          if (searchField === 'name' && !fullName.includes(query)) return false;
          if (searchField === 'cin' && !cin.includes(query)) return false;
          if (searchField === 'email' && !email.includes(query)) return false;
          if (searchField === 'phone' && !phone.includes(query)) return false;
          if (searchField === 'username' && !username.includes(query)) return false;
          if (searchField === 'all') {
            const matchesAny =
              fullName.includes(query) ||
              username.includes(query) ||
              cin.includes(query) ||
              email.includes(query) ||
              phone.includes(query) ||
              idStr.includes(query);
            if (!matchesAny) return false;
          }
        }

        // 2. Integration Date Filter
        if (dateFilter !== 'all') {
          if (!agent.date_integration) return false;
          const integrationDate = new Date(agent.date_integration);

          if (dateFilter === 'this_month') {
            if (
              integrationDate.getMonth() !== currentMonth ||
              integrationDate.getFullYear() !== currentYear
            ) {
              return false;
            }
          } else if (dateFilter === 'this_year') {
            if (integrationDate.getFullYear() !== currentYear) {
              return false;
            }
          } else if (dateFilter === 'older') {
            if (integrationDate.getFullYear() >= currentYear) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.date_integration || 0) - new Date(a.date_integration || 0) || b.id - a.id;
        }
        if (sortBy === 'oldest') {
          return new Date(a.date_integration || 0) - new Date(b.date_integration || 0) || a.id - b.id;
        }
        const nameA = `${a.user?.first_name || ''} ${a.user?.last_name || ''}`.trim();
        const nameB = `${b.user?.first_name || ''} ${b.user?.last_name || ''}`.trim();

        if (sortBy === 'name_asc') return nameA.localeCompare(nameB);
        if (sortBy === 'name_desc') return nameB.localeCompare(nameA);
        return 0;
      });
  }, [agents, searchQuery, searchField, dateFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    searchField !== 'all' ||
    dateFilter !== 'all' ||
    sortBy !== 'newest';

  const resetFilters = () => {
    setSearchQuery('');
    setSearchField('all');
    setDateFilter('all');
    setSortBy('newest');
  };

  // FORM HANDLING
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInfos((prev) => ({
      ...prev,
      [name]: value,
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
      password_confirmation: '',
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
        date_integration: new Date().toISOString().split('T')[0],
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
        setError(Object.values(validationErrors).flat().join(' '));
      } else {
        setError(err.response?.data?.message || 'Could not create agent.');
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
        email: infos.email,
      };

      await api.patch(`/agents/${selectedAgent.id}`, payload);

      setModal(null);
      setSelectedAgent(null);
      resetForm();
      await getAgents();
      setSuccess('Agent updated successfully.');
    } catch (err) {
      console.error('Failed to update agent:', err);
      const validationErrors = err.response?.data?.errors;

      if (validationErrors) {
        setError(Object.values(validationErrors).flat().join(' '));
      } else {
        setError(err.response?.data?.message || 'Could not update agent.');
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
      setError(err.response?.data?.message || 'Could not delete agent.');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = can(role, 'agents', 'create');
  const canUpdate = can(role, 'agents', 'update');
  const canDelete = can(role, 'agents', 'delete');
  const hasRowActions = canUpdate || canDelete;

  const { rows: visibleRows, controls: pagination } = useRecordPage(filteredAgents);

  return (
    <section className="agents-section dashboard-page" id="agents-section">
      <div className="container">
        {/* HEADER */}
        <header className="agents-header dashboard-page-header">
          <div>
            <h1 className="agents-title">Agents Overview</h1>
            <p className="agents-subtitle">
              Manage authorized insurance advisors and portfolio representatives.
            </p>
          </div>

          <div className="agents-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => getAgents(true)}
              disabled={loading || refreshing}
              title="Refresh agents list"
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
                + Add Agent
              </button>
            )}
          </div>
        </header>

        {/* FEEDBACK */}
        {!modal && error && (
          <div className="agents-alert agents-alert--error" role="alert">
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
          <div className="agents-alert agents-alert--success" role="status">
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
        <div className="agents-toolbar dashboard-toolbar">
          <div className="agents-search-group">
            <select
              className="form-control agents-field-select"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              aria-label="Search by field"
            >
              <option value="all">All Fields</option>
              <option value="name">Full Name</option>
              <option value="cin">CIN</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="username">Username</option>
            </select>

            <div className="agents-search-input-wrap dashboard-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                className="form-control agents-search-input"
                placeholder={`Search by ${
                  searchField === 'all'
                    ? 'name, CIN, email, phone, username, or ID...'
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

          <div className="agents-filter-group">
            <select
              className="form-control agents-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by integration date"
            >
              <option value="all">Integration: All Dates</option>
              <option value="this_month">Joined This Month</option>
              <option value="this_year">Joined This Year</option>
              <option value="older">Previous Years</option>
            </select>

            <select
              className="form-control agents-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort agents"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
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
        <div className="agents-ledger-bar">
          <span className="agents-count-label">
            <strong>{filteredAgents.length}</strong> of <strong>{agents.length}</strong> agents match
          </span>
        </div>

        {/* AGENTS TABLE */}
        <div className="agents-ledger-card dashboard-panel">
          <div className="table-responsive">
            <table className="table-agents">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>CIN</th>
                  <th>Contact</th>
                  <th>Date Integration</th>
                  {hasRowActions && <th className="text-right">Actions</th>}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={hasRowActions ? 6 : 5} className="no-data">
                      Loading agents directory...
                    </td>
                  </tr>
                ) : filteredAgents.length > 0 ? (
                  visibleRows.map((agent) => (
                    <tr key={agent.id}>
                      <td className="agent-id">#{agent.id}</td>

                      <td>
                        <div className="dashboard-person">
                          <span className="dashboard-avatar" aria-hidden="true">
                            {[agent.user?.first_name, agent.user?.last_name]
                              .filter(Boolean)
                              .map((name) => name.charAt(0).toUpperCase())
                              .join('') || 'A'}
                          </span>
                          <div>
                            <strong className="agent-name">
                              {agent.user?.first_name} {agent.user?.last_name}
                            </strong>
                            {agent.user?.username && (
                              <span className="agent-subtext">@{agent.user.username}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge--neutral">
                          {agent.user?.CIN || '—'}
                        </span>
                      </td>

                      <td>
                        <span>{agent.user?.email || 'N/A'}</span>
                        {agent.user?.phone && (
                          <span className="agent-subtext">{agent.user.phone}</span>
                        )}
                      </td>

                      <td className="agent-date">
                        {formatDate(agent.date_integration)}
                      </td>

                      {hasRowActions && (
                        <td className="text-right">
                          <div className="action-buttons">
                            {canUpdate && (
                              <button
                                type="button"
                                className="btn-ledger"
                                onClick={() => openEditModal(agent)}
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                className="btn-ledger btn-ledger--danger"
                                onClick={() => openDeleteModal(agent)}
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
                        ? 'No agents match your current search or filter criteria.'
                        : 'No agents found in the directory.'}
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
        <div className="agent-modal-overlay dashboard-dialog" onClick={closeModal}>
          <div
            className="agent-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="agent-modal-header">
              <div>
                <span className="eyebrow">
                  {modal === 'create' ? 'New Registration' : `Record #${selectedAgent?.id}`}
                </span>
                <h2>{modal === 'create' ? 'Create an Agent' : 'Edit Agent'}</h2>
                <p>
                  {modal === 'create'
                    ? 'Register a new agent account and credentials.'
                    : 'Update the agent profile and contact details.'}
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

            <form
              className="agent-modal-form"
              onSubmit={modal === 'create' ? createAgent : updateAgent}
            >
              <div className="agent-form-row">
                <div className="agent-form-group">
                  <label htmlFor="first_name">First Name</label>
                  <input
                    id="first_name"
                    className="form-control"
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
                  <label htmlFor="last_name">Last Name</label>
                  <input
                    id="last_name"
                    className="form-control"
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
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    className="form-control"
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
                  <label htmlFor="CIN">National ID (CIN)</label>
                  <input
                    id="CIN"
                    className="form-control"
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
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    className="form-control"
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
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    className="form-control"
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
                <div className="agent-form-row">
                  <div className="agent-form-group">
                    <label htmlFor="password">Password</label>
                    <div className="agent-password-wrapper">
                      <input
                        id="password"
                        className="form-control"
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
                        className="password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="agent-form-group">
                    <label htmlFor="password_confirmation">Confirm Password</label>
                    <div className="agent-password-wrapper">
                      <input
                        id="password_confirmation"
                        className="form-control"
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
                        className="password-toggle"
                        onClick={() => setShowPasswordConf((prev) => !prev)}
                      >
                        {showPasswordConf ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="agents-alert agents-alert--error" role="alert">
                  <span>{error}</span>
                </div>
              )}

              <div className="agent-modal-actions">
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
        <div className="agent-modal-overlay dashboard-dialog" onClick={closeModal}>
          <div
            className="agent-modal agent-modal--delete"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="agent-modal-header">
              <div>
                <span className="eyebrow">Confirm Removal</span>
                <h2>Delete Agent</h2>
                <p>This action will permanently remove the agent record.</p>
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
              <div className="delete-agent-box">
                <strong>
                  {selectedAgent.user?.first_name} {selectedAgent.user?.last_name}
                </strong>
                <span>
                  #{selectedAgent.id} • {selectedAgent.user?.email}
                </span>
              </div>
            )}

            {error && (
              <div className="agents-alert agents-alert--error" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="agent-modal-actions">
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
