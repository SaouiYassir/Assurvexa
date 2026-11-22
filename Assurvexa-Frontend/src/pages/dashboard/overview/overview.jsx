import { useEffect, useState } from 'react';
import { Briefcase, FileCheck, FilePlus, Plus, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { can } from '../../../services/permissions';
import './overview.css';

const OVERVIEW_COPY = {
  admin: ['Admin Dashboard', 'Track insurance activity, claim status, and reimbursements.'],
  agent: ['Overview', 'Review your clients, contracts, and claims awaiting action.'],
  customer: ['Overview', 'View your coverage, claims, and reimbursements.'],
};

const STATUS_COLORS = {
  approved: '#547a65',
  pending: '#b48a53',
  rejected: '#a76660',
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

function Overview() {
  const [role, setRole] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/statistics');
        if (isMounted && response.data?.success) {
          setRole(response.data.role);
          setStats(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Unable to load dashboard overview.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatistics();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="dashboard-page overview-section">
        <div className="container">
          <div className="dashboard-panel overview-feedback" role="status">
            <p>Loading dashboard overview...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return (
      <section className="dashboard-page overview-section">
        <div className="container">
          <div className="dashboard-panel overview-feedback" role="alert">
            <h1>Dashboard unavailable</h1>
            <p>{error || 'No data returned from the server.'}</p>
          </div>
        </div>
      </section>
    );
  }

  const [title, description] = OVERVIEW_COPY[role] ?? ['Overview', ''];

  return (
    <section className="dashboard-page overview-section">
      <div className="container">
        <header className="dashboard-page-header overview-header">
          <h1 className="overview-title">
            {title}{role === 'admin' && <><br />Overview</>}
          </h1>
          <p>{description}</p>
          <div className="overview-actions">
            {can(role, 'policies', 'create') && (
              <Link to="/dashboard/policies" className="btn btn-primary">
                <Plus size={16} aria-hidden="true" /> Create Policy
              </Link>
            )}
            {can(role, 'agents', 'create') && (
              <Link to="/dashboard/agents" className="btn btn-secondary">
                <UserPlus size={16} aria-hidden="true" /> Register Agent
              </Link>
            )}
            {can(role, 'customers', 'create') && (
              <Link to="/dashboard/customers" className="btn btn-secondary">
                <UserPlus size={16} aria-hidden="true" /> Add Customer
              </Link>
            )}
            {can(role, 'contracts', 'create') && (
              <Link to="/dashboard/contracts" className="btn btn-primary">
                <Briefcase size={16} aria-hidden="true" /> Issue Contract
              </Link>
            )}
            {can(role, 'claims', 'create') && (
              <Link to="/dashboard/claims" className="btn btn-primary">
                <FilePlus size={16} aria-hidden="true" /> File a Claim
              </Link>
            )}
            {can(role, 'claims', 'view') && !can(role, 'claims', 'create') && (
              <Link to="/dashboard/claims" className="btn btn-secondary">
                <FileCheck size={16} aria-hidden="true" />
                {can(role, 'claims', 'update') ? 'Process Claims' : 'View Claims'}
              </Link>
            )}
          </div>
        </header>

        {/* ================= ADMIN VIEW ================= */}
        {role === 'admin' && (
          <>
            {/* System Totals */}
            <div className="overview-metrics overview-metrics--admin overview-block">
              <div className="card stat-card">
                <span className="stat-label">Total Agents</span>
                <div className="stat-value">{stats.totals?.agents ?? 0}</div>
                {can(role, 'agents', 'view') && (
                  <Link to="/dashboard/agents" className="stat-link">Manage agents</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Registered Customers</span>
                <div className="stat-value">{stats.totals?.customers ?? 0}</div>
                {can(role, 'customers', 'view') && (
                  <Link to="/dashboard/customers" className="stat-link">View directory</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Insurance Policies</span>
                <div className="stat-value">{stats.totals?.policies ?? 0}</div>
                {can(role, 'policies', 'view') && (
                  <Link to="/dashboard/policies" className="stat-link">Configure catalog</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Total Contracts</span>
                <div className="stat-value">{stats.totals?.contracts ?? 0}</div>
                {can(role, 'contracts', 'view') && (
                  <Link to="/dashboard/contracts" className="stat-link">Inspect contracts</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Total Claims</span>
                <div className="stat-value">{stats.totals?.claims ?? 0}</div>
                {can(role, 'claims', 'view') && (
                  <Link to="/dashboard/claims" className="stat-link">Audit claims</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Reimbursement Records</span>
                <div className="stat-value">{stats.totals?.reimbursements ?? 0}</div>
                {can(role, 'reimbursements', 'view') && (
                  <Link to="/dashboard/reimbursements" className="stat-link">View ledger</Link>
                )}
              </div>
            </div>

            <div className="overview-charts overview-block">
              <div className="dashboard-panel overview-panel">
                <h2 className="card-title">Reimbursements</h2>
                <p className="overview-subtext">Paid and pending amounts across all claims</p>
                <ReimbursementBars financials={stats.financials} />
                <div className="status-group">
                  <h3 className="status-group-heading">Payment records by status</h3>
                  <StatusList items={stats.reimbursements_by_status} />
                </div>
              </div>

              <div className="dashboard-panel overview-panel">
                <h2 className="card-title">Claims by Status</h2>
                <p className="overview-subtext">Breakdown of submitted claims</p>
                <ClaimsDistribution items={stats.claims_by_status} />
              </div>
            </div>

            <div className="dashboard-panel overview-panel overview-panel--table">
              <div className="card-header-inline">
                <h2 className="card-title">Recent Claims</h2>
                {can(role, 'claims', 'view') && (
                  <Link to="/dashboard/claims" className="stat-link">View all claims</Link>
                )}
              </div>
              <ClaimsTable claims={stats.recent_claims} showCustomer />
            </div>
          </>
        )}

        {/* ================= AGENT VIEW ================= */}
        {role === 'agent' && (
          <>
            <div className="overview-metrics overview-block">
              <div className="card stat-card">
                <span className="stat-label">My Customers</span>
                <div className="stat-value">{stats.totals?.my_customers ?? 0}</div>
                {can(role, 'customers', 'view') && (
                  <Link to="/dashboard/customers" className="stat-link">Client list</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Active Contracts</span>
                <div className="stat-value">{stats.totals?.active_contracts ?? 0}</div>
                {can(role, 'contracts', 'view') && (
                  <Link to="/dashboard/contracts" className="stat-link">Manage contracts</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Pending Claims</span>
                <div className="stat-value">{stats.totals?.pending_claims ?? 0}</div>
                {can(role, 'claims', 'view') && (
                  <Link to="/dashboard/claims" className="stat-link">Review queue</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Pending Payments</span>
                <div className="stat-value">{stats.totals?.pending_payments ?? 0}</div>
                {can(role, 'reimbursements', 'view') && (
                  <Link to="/dashboard/reimbursements" className="stat-link">Process payouts</Link>
                )}
              </div>
            </div>

            <div className="grid grid-2 overview-block">
              <div className="card">
                <h3 className="card-title">Portfolio Claims by Status</h3>
                <ClaimsDistribution items={stats.claims_by_status} />
              </div>

              <div className="card">
                <div className="card-header-inline">
                  <h3 className="card-title">Action Required: Pending Claims</h3>
                  {can(role, 'claims', 'view') && (
                    <Link to="/dashboard/claims" className="stat-link">Open queue</Link>
                  )}
                </div>
                <ClaimsTable
                  claims={stats.action_required_claims}
                  showCustomer
                  canUpdate={can(role, 'claims', 'update')}
                />
              </div>
            </div>
          </>
        )}

        {/* ================= CUSTOMER VIEW ================= */}
        {role === 'customer' && (
          <>
            <div className="overview-metrics overview-block">
              <div className="card stat-card">
                <span className="stat-label">Active Contracts</span>
                <div className="stat-value">{stats.totals?.active_contracts ?? 0}</div>
                {can(role, 'contracts', 'view') && (
                  <Link to="/dashboard/contracts" className="stat-link">View coverage</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Total Claims</span>
                <div className="stat-value">{stats.totals?.total_claims ?? 0}</div>
                {can(role, 'claims', 'view') && (
                  <Link to="/dashboard/claims" className="stat-link">Claim history</Link>
                )}
              </div>

              <div className="card stat-card">
                <span className="stat-label">Pending Claims</span>
                <div className="stat-value">{stats.totals?.pending_claims ?? 0}</div>
                <span className="stat-meta">Currently under review</span>
              </div>

              <div className="card stat-card">
                <span className="stat-label">Total Reimbursed</span>
                <div className="stat-value">
                  {formatCurrency(stats.totals?.total_reimbursed)}
                </div>
                {can(role, 'reimbursements', 'view') && (
                  <Link to="/dashboard/reimbursements" className="stat-link">Payout statements</Link>
                )}
              </div>
            </div>

            <div className="grid grid-2 overview-block">
              {/* Active Contracts List */}
              <div className="card">
                <div className="card-header-inline">
                  <h3 className="card-title">My Active Policies</h3>
                  {can(role, 'policies', 'view') && (
                    <Link to="/dashboard/policies" className="stat-link">Browse plans</Link>
                  )}
                </div>

                {stats.active_contracts?.length > 0 ? (
                  <ul className="overview-list">
                    {stats.active_contracts.map((contract) => (
                      <li key={contract.id} className="overview-list-item">
                        <div>
                          <strong>{contract.policy?.name || `Contract #${contract.id}`}</strong>
                          <span className="overview-subtext">
                            Ref: {contract.contract_number || `#${contract.id}`} • Valid until{' '}
                            {formatDate(contract.end_date)}
                          </span>
                        </div>
                        <span className="badge badge--active">{contract.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="overview-empty">You have no active contracts at the moment.</p>
                )}
              </div>

              {/* Recent Claims */}
              <div className="card">
                <div className="card-header-inline">
                  <h3 className="card-title">Recent Claims</h3>
                  {can(role, 'claims', 'view') && (
                    <Link to="/dashboard/claims" className="stat-link">View all</Link>
                  )}
                </div>
                <ClaimsTable
                  claims={stats.recent_claims}
                  showReimbursement
                  canUpdate={can(role, 'claims', 'update')}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* --- Sub-components for clean rendering --- */

function StatusList({ items }) {
  const entries = items ? Object.entries(items) : [];

  if (entries.length === 0) {
    return <p className="overview-empty">No records available.</p>;
  }

  return (
    <ul className="status-list">
      {entries.map(([status, count]) => (
        <li key={status} className="status-list-item">
          <span className={`badge badge--${status.toLowerCase()}`}>{status}</span>
          <span className="status-count">{count}</span>
        </li>
      ))}
    </ul>
  );
}

function ReimbursementBars({ financials }) {
  const amounts = [
    { label: 'Paid', amount: Number(financials?.total_reimbursed_amount ?? 0), color: '#4a4540' },
    { label: 'Pending', amount: Number(financials?.pending_reimbursement_amount ?? 0), color: '#b39d87' },
  ];
  const max = Math.max(...amounts.map(({ amount }) => amount), 1);

  return (
    <ul className="overview-bars">
      {amounts.map(({ label, amount, color }) => (
        <li key={label}>
          <div className="overview-bar-label">
            <span>{label}</span>
            <strong>{formatCurrency(amount)}</strong>
          </div>
          <div className="overview-bar-track" aria-hidden="true">
            <span style={{ width: `${(amount / max) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ClaimsDistribution({ items }) {
  const segments = Object.entries(items ?? {}).map(([status, count]) => ({
    status,
    count: Number(count),
    color: STATUS_COLORS[status] ?? '#8c7a6b',
  }));
  const total = segments.reduce((sum, { count }) => sum + count, 0);

  if (total === 0) {
    return <p className="overview-empty">No claims to display.</p>;
  }

  let position = 0;
  const stops = segments.map(({ color, count }) => {
    const start = position;
    position += count;
    return `${color} ${(start / total) * 100}% ${(position / total) * 100}%`;
  });

  return (
    <div className="overview-distribution">
      <div className="overview-donut" style={{ backgroundImage: `conic-gradient(${stops.join(', ')})` }} aria-hidden="true">
        <div><strong>{total}</strong><span>Claims</span></div>
      </div>
      <ul className="overview-legend" aria-label={`Claim counts by status, ${total} total`}>
        {segments.map(({ status, count, color }) => (
          <li key={status}>
            <span className="overview-swatch" style={{ backgroundColor: color }} aria-hidden="true" />
            <span>{status}</span>
            <strong>{count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ClaimsTable({
  claims = [],
  showCustomer = false,
  showReimbursement = false,
  canUpdate = false,
}) {
  if (!claims || claims.length === 0) {
    return <p className="overview-empty">No claims to display.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="overview-table">
        <thead>
          <tr>
            <th>Claim</th>
            {showCustomer && <th>Customer</th>}
            <th>Status</th>
            {showReimbursement && <th>Payout</th>}
            <th>Date</th>
            {canUpdate && <th></th>}
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id}>
              <td>
                <strong>#{claim.id}</strong>
                {claim.contract?.contract_number && (
                  <span className="overview-subtext">{claim.contract.contract_number}</span>
                )}
              </td>

              {showCustomer && (
                <td>
                    {claim.customer
                    ? `${claim.customer.prenom ?? ''} ${claim.customer.nom ?? ''}`.trim() ||
                        claim.customer.name ||
                        `Client #${claim.customer_id}`
                    : `Client #${claim.customer_id}`}
                </td>
                )}

              <td>
                <span className={`badge badge--${claim.status?.toLowerCase()}`}>
                  {claim.status}
                </span>
              </td>

              {showReimbursement && (
                    <td>{claim.reimbursement ? formatCurrency(claim.reimbursement.prix) : '—'}</td>
                )}

              <td className="overview-date">{formatDate(claim.created_at)}</td>

              {canUpdate && (
                <td className="overview-table-action">
                  <Link to={`/dashboard/claims`} className="stat-link">
                    Review
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Overview;
