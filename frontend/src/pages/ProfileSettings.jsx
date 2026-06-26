import React, { useState, useEffect } from 'react';
import { User, Lock, Save, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ProfileSettings({ token, currentUser, onAuthChange }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setName(currentUser.name || '');
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    if (!username.trim()) {
      setError('Username cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim() || undefined, // Only send if entered
          name: name.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update credentials.');
      }

      // Update state and localStorage in parent App
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAuthChange(data.token, data.user);

      // Clear password field after success
      setPassword('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server error updating profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Account Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Change your login username, security credentials, or full name.
        </p>
      </header>

      {success && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          maxWidth: '600px'
        }}>
          <CheckCircle size={16} />
          <span>Profile credentials updated successfully.</span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '12px 16px',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '24px',
          maxWidth: '600px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '30px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px' }}>
          <User size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Login Credentials</h3>
        </div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input 
            type="text" 
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Display Name"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Username</label>
          <input 
            type="text" 
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Change Login Username"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label">New Password (Leave blank to keep current)</label>
          <input 
            type="password" 
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new security password"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          <Save size={16} />
          <span>{loading ? 'Saving...' : 'Update Credentials'}</span>
        </button>
      </form>
    </div>
  );
}
