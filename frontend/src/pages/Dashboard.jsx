import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XOctagon, 
  ArrowRightLeft, 
  Coins,
  ArrowRight,
  TrendingUp,
  Package
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function Dashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/dashboard-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch dashboard statistics.');
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error communicating with server.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'var(--status-rejected-text)' }}>
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const { kpis, returnTrends, topProducts, recentActivities } = stats;

  const cardData = [
    { title: 'Total Return Claims', value: kpis.totalRequests, icon: <FileText size={22} />, color: '#1d4ed8', borderClass: 'card-blue', link: '/claims' },
    { title: 'Pending Inspections', value: kpis.pendingInspections, icon: <AlertTriangle size={22} />, color: '#d97706', borderClass: 'card-orange', link: '/claims?status=Submitted' },
    { title: 'Replacements Processed', value: kpis.replacementsProcessed, icon: <ArrowRightLeft size={22} />, color: '#4338ca', borderClass: 'card-indigo', link: '/claims?status=Replacement%20Dispatched' },
    { title: 'Credit Notes Issued', value: kpis.creditNotesIssued, icon: <Coins size={22} />, color: '#15803d', borderClass: 'card-green', link: '/claims?status=Credit%20Note%20Issued' }
  ];

  // Colors for top products bar chart
  const BAR_COLORS = ['#3b82f6', '#60a5fa', '#2563eb', '#93c5fd', '#1d4ed8'];

  return (
    <div className="animate-fade-in" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Claims & Goods Control Panel</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Real-time overview of Manikanta Enterprises return logs, inspection queues, and credit decisions.</p>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        {cardData.map((card, i) => (
          <div 
            key={i} 
            className={`glass-panel ${card.borderClass}`}
            onClick={() => navigate(card.link)}
            style={{
              padding: '24px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.title}</span>
              <div style={{
                color: card.color,
                backgroundColor: `${card.color}15`,
                padding: '8px',
                borderRadius: '8px'
              }}>
                {card.icon}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)' }}>{card.value}</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              color: 'var(--accent-primary)',
              fontWeight: 500,
              marginTop: '4px'
            }}>
              <span>View detailed registry</span>
              <ArrowRight size={12} />
            </div>

            {/* Visual accent bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '4px',
              backgroundColor: card.color
            }} />
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Trend Area Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>Return Trends & Quantities</h3>
          </div>
          
          <div style={{ width: '100%', height: '300px' }}>
            {returnTrends.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No trend data logged yet.
              </div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={returnTrends}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" />
                  <XAxis dataKey="month" stroke="var(--text-light)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-light)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-input)', 
                      borderColor: 'var(--border-main)',
                      borderRadius: '8px',
                      color: 'var(--text-main)'
                    }} 
                  />
                  <Area type="monotone" dataKey="count" stroke="var(--accent-primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" name="Return Claims" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px'
      }}>
        {/* Top Products Bar Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Package size={20} style={{ color: 'var(--accent-secondary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>Most Returned Products (Units)</h3>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            {topProducts.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No product return logs yet.
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-light)" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-light)" fontSize={11} tickLine={false} width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-main)',
                      borderRadius: '8px',
                      color: 'var(--text-main)'
                    }}
                  />
                  <Bar dataKey="units" radius={[0, 4, 4, 0]} barSize={15} name="Units Returned">
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '20px' }}>Recent System Actions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivities.map((act) => (
              <div key={act.id} style={{
                display: 'flex',
                gap: '14px',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-main)',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  padding: '8px',
                  backgroundColor: 'var(--border-main)',
                  borderRadius: '8px',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  minWidth: '105px',
                  textAlign: 'center'
                }}>
                  {act.claim_id}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{act.action}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {new Date(act.created_at).toLocaleString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{act.details}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                    By {act.user_name} ({act.user_role === 'staff' ? 'Processing Staff' : act.user_role})
                  </span>
                </div>
              </div>
            ))}

            {recentActivities.length === 0 && (
              <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No activities logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Local Page Styling overrides */}
      <style>{`
        .card-blue:hover { border-color: #1d4ed8; }
        .card-orange:hover { border-color: #d97706; }
        .card-indigo:hover { border-color: #4338ca; }
        .card-green:hover { border-color: #15803d; }
      `}</style>
    </div>
  );
}
