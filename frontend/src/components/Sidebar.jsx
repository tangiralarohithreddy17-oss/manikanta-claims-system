import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  BarChart3, 
  History, 
  LogOut,
  ShieldAlert,
  Users,
  Settings,
  User
} from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const isManagerOrAdmin = user && (user.role === 'manager' || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      color: '#cbd5e1',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Branding */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <h1 style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '0.05em'
        }}>MANIKANTA</h1>
        <span style={{
          fontSize: '0.75rem',
          color: 'var(--accent-secondary)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>Enterprises Claims</span>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '24px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/claims" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          end
        >
          <FileText size={18} />
          <span>Claims Registry</span>
        </NavLink>

        {user && user.role !== 'admin' && (
          <NavLink 
            to="/claims/new" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <PlusCircle size={18} />
            <span>Log Goods Return</span>
          </NavLink>
        )}

        {isManagerOrAdmin && (
          <NavLink 
            to="/reports" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={18} />
            <span>Reports & Analytics</span>
          </NavLink>
        )}

        {isManagerOrAdmin && (
          <NavLink 
            to="/audit-logs" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <History size={18} />
            <span>Audit History</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink 
            to="/staff" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Manage Staff</span>
          </NavLink>
        )}

        {isAdmin && (
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>System Settings</span>
          </NavLink>
        )}

        <NavLink 
          to="/profile" 
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <User size={18} />
          <span>My Profile</span>
        </NavLink>
      </nav>

      {/* User profile & Logout */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: '2px solid rgba(255, 255, 255, 0.1)'
          }}>
            {user ? user.name.charAt(0) : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>{user ? user.name : 'Loading User...'}</span>
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-light)',
              textTransform: 'capitalize'
            }}>
              {user ? (user.role === 'staff' ? 'Processing Staff' : user.role) : 'Guest'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="btn"
          style={{
            width: '100%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            fontSize: '0.8rem',
            padding: '8px 12px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}
        >
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>

      {/* Embedded CSS for sidebar links */}
      <style>{`
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-left: 3px solid transparent;
        }
        .sidebar-link:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.04);
        }
        .sidebar-link.active {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.07);
          border-left-color: var(--accent-primary);
        }
        .sidebar-link.active svg {
          color: var(--accent-primary) !important;
        }
      `}</style>
    </aside>
  );
}
