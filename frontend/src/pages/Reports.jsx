import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, Cell, 
  PieChart, Pie, 
  AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { FileSpreadsheet, Printer, BarChart3, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Reports({ token }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch stats
        const statsRes = await fetch(`${API_BASE_URL}/api/reports/dashboard-stats`, { headers });
        if (!statsRes.ok) throw new Error('Failed to load dashboard report charts');
        const stats = await statsRes.json();
        setDashboardData(stats);

        // Fetch monthly summary
        const summaryRes = await fetch(`${API_BASE_URL}/api/reports/summary-report`, { headers });
        if (!summaryRes.ok) throw new Error('Failed to load summary reports table');
        const summary = await summaryRes.json();
        setSummaryData(summary);

      } catch (err) {
        console.error(err);
        setError(err.message || 'Server error loading reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [token]);

  // Client-side CSV Exporter
  const handleExportCSV = () => {
    if (summaryData.length === 0) return;

    // Header row
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Total Claims,Total Units Returned,Approved Claims,Rejected Claims,Pending Claims\r\n";

    // Data rows
    summaryData.forEach((row) => {
      csvContent += `"${row.month}",${row.totalClaims},${row.totalQty},${row.approved},${row.rejected},${row.pending}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `manikanta_claims_report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading reports...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div style={{ padding: '30px', color: 'var(--status-rejected-text)' }}>
        <h3>Error compiling reports</h3>
        <p>{error}</p>
      </div>
    );
  }

  const { returnTrends, topProducts, categories, approvalStats, severityData } = dashboardData;
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  const SEVERITY_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];

  return (
    <div className="animate-fade-in print-container" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Header Panel */}
      <div className="print-hide" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Reports & Analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Analyze claim frequencies, return reasons, damage severities, and manager resolution ratios.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary">
            <FileSpreadsheet size={16} />
            <span>Export CSV</span>
          </button>
          
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={16} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Print Specific Header */}
      <div className="print-only" style={{ display: 'none', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>MANIKANTA ENTERPRISES</h1>
        <h2 style={{ fontSize: '1.2rem', color: '#64748b', marginTop: '4px' }}>Goods Return & Claim Settlement Audit Report</h2>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '10px' }}>
          Exported on: {new Date().toLocaleString('en-IN')}
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        marginBottom: '30px'
      }}>
        {/* Row 1: Return trends AreaChart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '18px' }}>
            Goods Return Trends (Monthly Volumes)
          </h3>
          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer>
              <AreaChart data={returnTrends}>
                <defs>
                  <linearGradient id="colorCountR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" />
                <XAxis dataKey="month" stroke="var(--text-light)" fontSize={11} />
                <YAxis stroke="var(--text-light)" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="var(--accent-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCountR)" name="Claims Count" />
                <Area type="monotone" dataKey="units" stroke="var(--accent-secondary)" strokeWidth={2} fillOpacity={0} name="Units Returned" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Two column subcharts */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px'
        }}>
          {/* Categories Chart */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '18px' }}>
              Returned Product Categories
            </h3>
            <div style={{ width: '100%', height: '240px', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resolution Decisions Chart */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '18px' }}>
              Claim Resolution Statistics
            </h3>
            <div style={{ width: '100%', height: '240px', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={approvalStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {approvalStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Monthly Summary Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '18px' }}>
          Monthly Return Claims Summary Table
        </h3>
        
        {summaryData.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
            No aggregated data recorded.
          </p>
        ) : (
          <div className="table-container">
            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Billing Month</th>
                  <th>Total Claims Logged</th>
                  <th>Total Units Returned</th>
                  <th style={{ color: 'var(--status-credit-text)' }}>Approved Claims</th>
                  <th style={{ color: 'var(--status-rejected-text)' }}>Rejected Claims</th>
                  <th style={{ color: 'var(--status-awaiting-text)' }}>Pending Claims</th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.month}</strong></td>
                    <td>{row.totalClaims}</td>
                    <td>{row.totalQty}</td>
                    <td>{row.approved}</td>
                    <td>{row.rejected}</td>
                    <td>{row.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Embedded CSS for Print Overrides */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .glass-panel {
            background: #ffffff !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          aside {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
