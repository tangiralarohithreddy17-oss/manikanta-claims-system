import React, { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AuditLogs({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/audit`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to load system audit logs');
        }
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Server error loading audit trail.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [token]);

  // Filter logs by search query (Claim ID, User Name, Action, or Details)
  const filteredLogs = logs.filter(log => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    return (
      log.claim_id.toLowerCase().includes(search) ||
      log.user_name.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.details.toLowerCase().includes(search)
    );
  });

  return (
    <div className="animate-fade-in" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>System Audit Trails</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Chronological activity register tracking status advancements, inspector verdicts, and credit processing details.</p>
      </header>

      {/* Search Filter bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-light)'
          }} />
          <input 
            type="text" 
            className="form-control"
            style={{ paddingLeft: '40px', width: '100%' }}
            placeholder="Search by ID, action, user, comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading audit timeline...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--status-rejected-text)' }}>
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No matching audit logs found.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Claim ID</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Operated By</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {log.claim_id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.action}</span>
                    </td>
                    <td>
                      <p style={{ maxWidth: '450px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {log.details}
                      </p>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{log.user_name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'capitalize' }}>
                          Role: {log.user_role === 'staff' ? 'processing staff' : log.user_role}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
