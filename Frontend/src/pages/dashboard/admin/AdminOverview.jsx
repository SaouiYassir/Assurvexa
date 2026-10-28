import React, { useState } from 'react';
import { 
  Plus, 
  UserPlus, 
  FileCheck, 
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import './AdminOverview.css';
import { NavLink } from 'react-router-dom';

// --- Data ---
const barData = [
  { month: 'May', Premiums: 288000, Claims: 120000 },
  { month: 'Jun', Premiums: 310000, Claims: 145000 },
  { month: 'Jul', Premiums: 302000, Claims: 110000 },
  { month: 'Aug', Premiums: 326000, Claims: 124000 },
  { month: 'Sep', Premiums: 338000, Claims: 138000 },
  { month: 'Oct', Premiums: 350000, Claims: 152000 },
];

const donutData = [
  { name: 'Auto', value: 42, color: '#2d2c2a' },
  { name: 'Home', value: 28, color: '#8c7a6b' },
  { name: 'Health', value: 18, color: '#d3c9be' },
  { name: 'Life', value: 12, color: '#a3988c' },
];

const recentSubmissions = [
  {
    reference: 'CLM-2026-908',
    customer: 'Sarah Jenkins',
    type: 'Auto Insurance',
    amount: '$3,450',
    date: 'Oct 24, 2026',
    status: 'Under Review',
    statusClass: 'status-review'
  },
  {
    reference: 'POL-2026-441',
    customer: 'Marc Bernard',
    type: 'Home & Property',
    amount: '$1,200/yr',
    date: 'Oct 23, 2026',
    status: 'Approved',
    statusClass: 'status-approved'
  },
  {
    reference: 'CLM-2026-899',
    customer: 'David Ross',
    type: 'Health Premium',
    amount: '$890',
    date: 'Oct 22, 2026',
    status: 'Paid',
    statusClass: 'status-paid'
  }
];

export default function AdminOverview() {
  const [timeRange] = useState('2026 YTD');

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        
        {/* New Editorial Header Section */}
        <div className="header-section">
          <div className="header-content">
            <div className="header-eyebrow">
              <span className="eyebrow-line"></span>
              <span>Admin Portal</span>
            </div>
            <h1 className="header-title">Overview</h1>
          </div>
          
          <div className="header-actions">
            <NavLink className="btn-primary"> 
              <span>Create Policy</span>
            </NavLink>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-label">Active Policies</span>
            <div className="metric-row">
              <span className="metric-value">1,842</span>
              <span className="metric-badge badge-green">+8.4%</span>
            </div>
          </div>

          <div className="metric-card">
            <span className="metric-label">Pending Claims</span>
            <div className="metric-row">
              <span className="metric-value">34</span>
              <span className="metric-badge badge-yellow">12 Urgent</span>
            </div>
          </div>

          <div className="metric-card">
            <span className="metric-label">Active Agents</span>
            <div className="metric-row">
              <span className="metric-value">28</span>
              <span className="metric-badge badge-green">95% Active</span>
            </div>
          </div>

          <div className="metric-card">
            <span className="metric-label">Monthly Revenue</span>
            <div className="metric-row">
              <span className="metric-value">$348.5K</span>
              <span className="metric-badge badge-green">+14.2%</span>
            </div>
          </div>

          <div className="metric-card">
            <span className="metric-label">Loss Ratio</span>
            <div className="metric-row">
              <span className="metric-value">42.8%</span>
              <span className="metric-badge badge-green">-2.1% YoY</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          {/* Bar Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h2 className="chart-title">Premiums Collected vs Claims Paid</h2>
                <p className="chart-subtitle">Financial performance over the past 6 months</p>
              </div>
              <span className="chart-badge">{timeRange}</span>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ede6" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#777777', fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#777777', fontSize: 11 }}
                    ticks={[0, 50000, 100000, 150000, 200000, 250000, 300000, 350000]}
                    tickFormatter={(val) => (val === 0 ? '0' : `${val.toLocaleString()}`)}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e2dc',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="Premiums" fill="#31302e" radius={[2, 2, 0, 0]} maxBarSize={38} />
                  <Bar dataKey="Claims" fill="#d9d2c5" radius={[2, 2, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-swatch" style={{ backgroundColor: '#31302e' }}></span>
                <span>Premiums ($)</span>
              </div>
              <div className="legend-item">
                <span className="legend-swatch" style={{ backgroundColor: '#d9d2c5' }}></span>
                <span>Claims Paid ($)</span>
              </div>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="chart-card">
            <div>
              <h2 className="chart-title">Policy Type Distribution</h2>
              <p className="chart-subtitle">Active policy portfolio breakdown</p>
            </div>

            <div className="donut-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e2dc',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="donut-legend">
              {donutData.map((item) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-swatch" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          <div className="table-header">
            <h2 className="table-title">Recent Activity &amp; Submissions</h2>
            <a href="#view-all" className="view-all-link">
              <span>View All Claims</span>
              <ArrowRight size={13} />
            </a>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((row) => (
                  <tr key={row.reference}>
                    <td className="cell-reference">{row.reference}</td>
                    <td className="cell-customer">{row.customer}</td>
                    <td className="cell-type">{row.type}</td>
                    <td className="cell-amount">{row.amount}</td>
                    <td className="cell-date">{row.date}</td>
                    <td>
                      <span className={`status-badge ${row.statusClass}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}