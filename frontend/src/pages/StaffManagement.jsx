import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function StaffManagement({ token, currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Creation form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to retrieve user registry.');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error fetching user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      setActionLoading(false);
      return;
    }
    if (password.length < 5) {
      setError('Password must be at least 5 characters long.');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, name, role, password })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register account');
      }

      setSuccessMsg(`Account registered successfully for ${name} (${username}).`);
      setUsername('');
      setName('');
      setPassword('');
      setRole('staff');
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Error creating user account');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(`Are you sure you want to delete the user account for ${userToDelete.name} (${userToDelete.username})? This action is irreversible.`)) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/users/${userToDelete.username}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      setSuccessMsg(`Successfully deleted account for ${userToDelete.name}.`);
      await fetchUsers();
    } catch (err) {
      setError(err.message || 'Error deleting user account');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Staff & User Directory</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Register new personnel, review account directories, and manage access roles for Manikanta Enterprises.</p>
      </header>

      {/* Messages */}
      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: '4px',
          fontSize: '0.85rem',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          backgroundColor: 'rgba(0, 118, 0, 0.15)',
          border: '1px solid rgba(0, 118, 0, 0.3)',
          color: 'var(--severity-low-text)',
          padding: '12px 16px',
          borderRadius: '4px',
          fontSize: '0.85rem',
          marginBottom: '24px'
        }}>
          {successMsg}
        </div>
      )}

      {/* Layout Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Side: Create User Form */}
        <div className="glass-panel" style={{ padding: '24px', maxWidth: '500px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px' }}>
            <UserPlus size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Create New User Account</h3>
          </div>

          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. Kalyan Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username * (Unique)</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="e.g. kalyan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Access Role *</label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="staff">Return Processing Staff</option>
                <option value="manager">General Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password * (Min 5 chars)</label>
              <input 
                type="password" 
                className="form-control"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', color: '#131921', fontWeight: 600 }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Right Side: Users List Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px' }}>
            <Users size={18} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active User Directory</h3>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading staff records...</p>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Date Registered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((usr) => {
                    const isSelf = currentUser && currentUser.username.toLowerCase() === usr.username.toLowerCase();
                    return (
                      <tr key={usr.username}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{usr.name}</span>
                          {isSelf && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '0.7rem',
                              backgroundColor: 'var(--status-submitted-bg)',
                              color: 'var(--status-submitted-text)',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontWeight: 500
                            }}>
                              You
                            </span>
                          )}
                        </td>
                        <td><code>{usr.username}</code></td>
                        <td>
                          <span style={{
                            textTransform: 'capitalize',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: usr.role === 'admin' ? '#b12704' : usr.role === 'manager' ? '#007185' : 'inherit'
                          }}>
                            {usr.role === 'staff' ? 'processing staff' : usr.role}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          {new Date(usr.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger"
                            disabled={isSelf || actionLoading}
                            onClick={() => handleDeleteUser(usr)}
                            style={{
                              padding: '6px',
                              borderRadius: '4px',
                              opacity: isSelf ? 0.35 : 1,
                              cursor: isSelf ? 'not-allowed' : 'pointer'
                            }}
                            title={isSelf ? 'Cannot delete your own active account' : 'Delete user account'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
