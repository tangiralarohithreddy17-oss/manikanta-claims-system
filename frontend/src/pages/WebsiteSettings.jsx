import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, HelpCircle } from 'lucide-react';

export default function WebsiteSettings() {
  const [companyName, setCompanyName] = useState('Manikanta Enterprises');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [returnWindow, setReturnWindow] = useState('30');
  const [allowEdits, setAllowEdits] = useState('true');
  const [emailAlerts, setEmailAlerts] = useState('false');
  
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const savedCompany = localStorage.getItem('cfg_company_name');
    const savedPhone = localStorage.getItem('cfg_support_phone');
    const savedWindow = localStorage.getItem('cfg_return_window');
    const savedEdits = localStorage.getItem('cfg_allow_edits');
    const savedAlerts = localStorage.getItem('cfg_email_alerts');

    if (savedCompany) setCompanyName(savedCompany);
    if (savedPhone) setSupportPhone(savedPhone);
    if (savedWindow) setReturnWindow(savedWindow);
    if (savedEdits) setAllowEdits(savedEdits);
    if (savedAlerts) setEmailAlerts(savedAlerts);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    setSuccess(false);

    localStorage.setItem('cfg_company_name', companyName);
    localStorage.setItem('cfg_support_phone', supportPhone);
    localStorage.setItem('cfg_return_window', returnWindow);
    localStorage.setItem('cfg_allow_edits', allowEdits);
    localStorage.setItem('cfg_email_alerts', emailAlerts);

    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '30px', overflowY: 'auto' }}>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)' }}>Website Settings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Configure system-wide constants, contact numbers, and access preferences. (Admin Only)</p>
      </header>

      {success && (
        <div style={{
          backgroundColor: 'rgba(0, 118, 0, 0.15)',
          border: '1px solid rgba(0, 118, 0, 0.3)',
          color: 'var(--severity-low-text)',
          padding: '12px 16px',
          borderRadius: '4px',
          fontSize: '0.85rem',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>System configuration constants saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '30px', maxWidth: '650px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px' }}>
          <Settings size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Global Constants</h3>
        </div>

        <div className="form-group">
          <label className="form-label">Company Profile Name</label>
          <input 
            type="text" 
            className="form-control"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Helpdesk Support Number</label>
          <input 
            type="text" 
            className="form-control"
            value={supportPhone}
            onChange={(e) => setSupportPhone(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Product Return Grace Window (Days)</label>
          <input 
            type="number" 
            className="form-control"
            value={returnWindow}
            onChange={(e) => setReturnWindow(e.target.value)}
            min="1"
            required
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px', marginBottom: '24px', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px' }}>
          <HelpCircle size={18} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Access & Notification Control</h3>
        </div>

        <div className="form-group">
          <label className="form-label">Allow Claim Editing (Active Claims)</label>
          <select 
            className="form-control"
            value={allowEdits}
            onChange={(e) => setAllowEdits(e.target.value)}
          >
            <option value="true">Enable details editing for Staff/Manager/Admin</option>
            <option value="false">Disable editing (Lock details upon submission)</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label className="form-label">Automatic Email Reports (Status finalizations)</label>
          <select 
            className="form-control"
            value={emailAlerts}
            onChange={(e) => setEmailAlerts(e.target.value)}
          >
            <option value="false">Disabled (Mock System Mode)</option>
            <option value="true">Enabled (Sends SMTP notifications to registered accounts)</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ width: '100%', color: '#131921', fontWeight: 600 }}
        >
          <Save size={16} />
          <span>Save Configuration Settings</span>
        </button>
      </form>
    </div>
  );
}
